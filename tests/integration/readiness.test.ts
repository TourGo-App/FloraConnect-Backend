import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { connectDB, isDbConnected } from '../../src/config/database.js';
import { DatabaseConfigurationError } from '../../src/config/database.errors.js';
vi.mock('../../src/config/database.js', () => ({
  connectDB: vi.fn(),
  isDbConnected: vi.fn(),
}));
beforeEach(() => {
  vi.mocked(connectDB).mockReset();
  vi.mocked(isDbConnected).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
describe('Production database readiness', () => {
  it('establishes a database connection on a cold readiness request', async () => {
    vi.mocked(connectDB).mockResolvedValue({} as never);
    vi.mocked(isDbConnected).mockReturnValue(true);
    const response = await request(app).get('/api/health/db');
    expect(response.status).toBe(200);
    expect(response.body.database).toBe('connected');
    expect(connectDB).toHaveBeenCalledOnce();
  });
  it('returns safe configuration diagnostics without connection strings', async () => {
    vi.mocked(connectDB).mockRejectedValue(new DatabaseConfigurationError());
    const response = await request(app).get('/api/health/db');
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('DATABASE_NOT_CONFIGURED');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(JSON.stringify(response.body)).not.toContain('mongodb');
  });
  it('keeps liveness independent of an unavailable database', async () => {
    vi.mocked(connectDB).mockRejectedValue(new Error('offline'));
    expect((await request(app).get('/api/health')).status).toBe(200);
    expect(connectDB).not.toHaveBeenCalled();
  });
  it('returns an actionable login configuration error without attempting password checks', async () => {
    vi.mocked(connectDB).mockRejectedValue(new DatabaseConfigurationError());
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://flora-connect-frontend.vercel.app')
      .send({ email: 'sample@example.test', password: 'test-only-password' });
    expect(response.status).toBe(503);
    expect(response.body.code).toBe('DATABASE_NOT_CONFIGURED');
    expect(response.body.message).toContain('database');
  });
});
