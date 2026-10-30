import type { RequestHandler } from 'express';

// Application liveness must not depend on the database or external providers.
export const getHealth: RequestHandler = (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok', service: 'FloraConnect API' });
};
