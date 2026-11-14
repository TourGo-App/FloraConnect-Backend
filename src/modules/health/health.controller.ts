import type { RequestHandler } from 'express';
import { connectDB, isDbConnected } from '../../config/database.js';
import { DatabaseConfigurationError } from '../../config/database.errors.js';

// Application liveness must not depend on the database or external providers.
export const getHealth: RequestHandler = (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok', service: 'FloraConnect API' });
};

// Database readiness check
export const getDbHealth: RequestHandler = async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await connectDB();
    const connected = isDbConnected();
    res
      .status(connected ? 200 : 503)
      .json({
        status: connected ? 'ok' : 'degraded',
        service: 'FloraConnect API',
        database: connected ? 'connected' : 'disconnected',
      });
  } catch (error) {
    res
      .status(503)
      .json({
        status: 'degraded',
        service: 'FloraConnect API',
        database: 'disconnected',
        code:
          error instanceof DatabaseConfigurationError
            ? error.code
            : 'DATABASE_UNAVAILABLE',
      });
  }
};
