import { Router } from 'express';

export const apiRouter = Router();

// Liveness only: no database or external service is required.
apiRouter.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok', service: 'FloraConnect API' });
});
