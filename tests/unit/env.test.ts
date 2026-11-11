import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMongoUri } from '../../src/config/env.js';
import { DatabaseConfigurationError } from '../../src/config/database.errors.js';

afterEach(() => vi.unstubAllEnvs());
describe('Database configuration', () => {
  it('keeps the localhost fallback for local development only', () => {
    vi.stubEnv('MONGODB_URI', undefined);
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL', undefined);
    expect(getMongoUri()).toBe('mongodb://localhost:27017/floraconnect');
  });
  it.each([undefined, '', '   '])(
    'rejects missing production URI %s rather than connecting to localhost',
    (uri) => {
      vi.stubEnv('MONGODB_URI', uri);
      vi.stubEnv('NODE_ENV', 'production');
      expect(getMongoUri).toThrow(DatabaseConfigurationError);
    },
  );
  it('requires a configured URI on Vercel even without NODE_ENV', () => {
    vi.stubEnv('MONGODB_URI', undefined);
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL', '1');
    expect(getMongoUri).toThrow(DatabaseConfigurationError);
  });
  it.each([
    'mongodb://localhost:27017/floraconnect',
    'mongodb://127.0.0.1:27017/floraconnect',
    'mongodb://[::1]:27017/floraconnect',
    'mongodb://example.test:27017,localhost:27017/floraconnect',
  ])('rejects laptop/loopback MongoDB hosts on Vercel: %s', (uri) => {
    vi.stubEnv('MONGODB_URI', uri);
    vi.stubEnv('VERCEL', '1');
    expect(getMongoUri).toThrow(DatabaseConfigurationError);
  });
  it('accepts a trimmed Atlas URI without changing its value', () => {
    vi.stubEnv(
      'MONGODB_URI',
      '  mongodb+srv://sample:example@cluster.example.test/floraconnect  ',
    );
    vi.stubEnv('VERCEL', '1');
    expect(getMongoUri()).toBe(
      'mongodb+srv://sample:example@cluster.example.test/floraconnect',
    );
  });
  it('does not mistake a username for a loopback hostname', () => {
    vi.stubEnv(
      'MONGODB_URI',
      'mongodb+srv://localhost:example@cluster.example.test/floraconnect',
    );
    vi.stubEnv('VERCEL', '1');
    expect(getMongoUri()).toContain('@cluster.example.test');
  });
  it.each([
    'mongodb://',
    'mongodb+srv://',
    'https://example.test',
    'MONGODB_URI=mongodb+srv://cluster.example.test',
    'mongodb+srv://cluster.example.test/invalid value',
  ])('rejects invalid connection-string format', (uri) => {
    vi.stubEnv('MONGODB_URI', uri);
    expect(getMongoUri).toThrow(DatabaseConfigurationError);
  });
});
