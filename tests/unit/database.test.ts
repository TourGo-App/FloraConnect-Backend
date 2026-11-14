import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/database.js';
import { DatabaseUnavailableError } from '../../src/config/database.errors.js';
vi.mock('mongoose', () => ({
  default: {
    connection: { readyState: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));
vi.mock('../../src/config/env.js', () => ({
  getMongoUri: () => 'mongodb://test-only.example.test/database',
}));
const connection = mongoose.connection as unknown as { readyState: number };
beforeEach(async () => {
  vi.mocked(mongoose.disconnect).mockImplementation(async () => {
    connection.readyState = 0;
  });
  await disconnectDB();
  vi.mocked(mongoose.connect).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
describe('MongoDB connection reuse and recovery', () => {
  it('shares one pending connection for simultaneous requests', async () => {
    let finish!: (value: typeof mongoose) => void;
    vi.mocked(mongoose.connect).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const first = connectDB();
    const second = connectDB();
    expect(mongoose.connect).toHaveBeenCalledOnce();
    connection.readyState = 1;
    finish(mongoose);
    expect(await first).toBe(mongoose);
    expect(await second).toBe(mongoose);
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledOnce();
  });
  it('opens a new connection after an established connection drops', async () => {
    vi.mocked(mongoose.connect).mockImplementation(async () => {
      connection.readyState = 1;
      return mongoose;
    });
    await connectDB();
    connection.readyState = 0;
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });
  it('clears failed attempts so the next request can recover without leaking credentials', async () => {
    vi.mocked(mongoose.connect)
      .mockRejectedValueOnce(
        new Error('mongodb://private:secret@example.test/db'),
      )
      .mockImplementationOnce(async () => {
        connection.readyState = 1;
        return mongoose;
      });
    await expect(connectDB()).rejects.toBeInstanceOf(DatabaseUnavailableError);
    expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
      'private:secret',
    );
    await expect(connectDB()).resolves.toBe(mongoose);
    expect(mongoose.connect).toHaveBeenCalledTimes(2);
  });
});
