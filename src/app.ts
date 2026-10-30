import express from 'express';
import { frontendCors } from './middleware/cors.js';
import { notFound } from './middleware/not-found.js';
import { apiRouter } from './routes/index.js';

const app = express();
app.disable('x-powered-by');
app.use(frontendCors);
app.get('/', (_req, res) => { res.redirect('/api/health'); });
app.use('/api', apiRouter);
app.use(notFound);

export default app;
