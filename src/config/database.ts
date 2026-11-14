import mongoose from 'mongoose';
import { getMongoUri } from './env.js';
import {
  DatabaseUnavailableError,
  databaseFailureReason,
} from './database.errors.js';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache to preserve connections across serverless / hot-reload invocations
const globalWithMongoose = globalThis as unknown as {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = globalWithMongoose.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalWithMongoose.mongooseCache) {
  globalWithMongoose.mongooseCache = cache;
}

/**
 * Connect to MongoDB with connection reuse.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn && mongoose.connection.readyState === 1) {
    return cache.conn;
  }

  if (!cache.promise) {
    const uri = getMongoUri();
    cache.conn = null;
    const pending = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 5000 })
      .then((connection) => {
        cache.conn = connection;
        return connection;
      })
      .catch((error: unknown) => {
        cache.conn = null;
        console.error('MongoDB connection failed', {
          reason: databaseFailureReason(error),
        });
        throw new DatabaseUnavailableError();
      })
      .finally(() => {
        if (cache.promise === pending) cache.promise = null;
      });
    cache.promise = pending;
  }
  return cache.promise;
}

/**
 * Check if MongoDB connection is active.
 * 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
 */
export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Disconnect from MongoDB (useful for graceful shutdown and tests).
 */
export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  cache.conn = null;
  cache.promise = null;
}
