import { describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('FloraConnect API', () => {
  it.each(['https://flora-connect-frontend.vercel.app', 'http://localhost:5173', 'http://127.0.0.1:5173'])('allows browser requests from %s', async (origin) => {
    const response = await request(app).get('/api/health').set('Origin', origin);
    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });
  it('does not grant CORS access to unrelated websites', async () => {
    const response = await request(app).get('/api/health').set('Origin', 'https://unrelated.example');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('handles browser preflight requests', async () => {
    const response = await request(app).options('/api/health')
      .set('Origin', 'https://flora-connect-frontend.vercel.app')
      .set('Access-Control-Request-Method', 'GET');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('https://flora-connect-frontend.vercel.app');
  });
  it('returns the health contract without requiring services or credentials', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({ status: 'ok', service: 'FloraConnect API' });
  });

  it('redirects the root URL to the working health endpoint', async () => {
    const redirect = await request(app).get('/');
    expect(redirect.status).toBe(302);
    expect(redirect.headers.location).toBe('/api/health');
    const response = await request(app).get('/').redirects(1);
    expect(response.status).toBe(200);
    expect(response.body.service).toBe('FloraConnect API');
  });

  it('returns JSON 404 for unknown endpoints', async () => {
    const response = await request(app).get('/api/missing');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Not found' });
  });
});
