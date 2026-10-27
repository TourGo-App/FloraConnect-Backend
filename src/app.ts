import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';

const app = express();
app.disable('x-powered-by');
const allowedOrigins = (process.env.FRONTEND_ORIGINS ??
  'https://flora-connect-frontend.vercel.app,http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.get('/', (_req, res) => {
  res.redirect('/api/health');
});
app.use('/api', apiRouter);
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

export default app;
