import app from './app.js';

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

// Only local/standalone execution listens; Vercel imports the Express app.
app.listen(port, () => {
  console.log(`FloraConnect API: http://localhost:${port}/api/health`);
});
