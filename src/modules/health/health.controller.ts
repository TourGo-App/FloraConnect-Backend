import type { RequestHandler } from 'express';
import { isDbConnected } from '../../config/database.js';

// Application liveness must not depend on the database or external providers.
export const getHealth: RequestHandler = (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok', service: 'FloraConnect API' });
};

// Database readiness check
export const getDbHealth: RequestHandler = (_req, res) => {
  res.set('Cache-Control', 'no-store');
  const connected = isDbConnected();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'degraded',
    service: 'FloraConnect API',
    database: connected ? 'connected' : 'disconnected',
  });
};
