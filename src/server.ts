import app from './app.js';
import { getPort } from './config/env.js';
import { connectDB } from './config/database.js';

const port = getPort();

// Connect to MongoDB on standalone server start
try {
  await connectDB();
} catch (err) {
  console.warn('MongoDB connection error on startup:', (err as Error).message);
}

// Only local/standalone execution listens; Vercel imports src/app.ts.
app.listen(port, () => {
  console.log(`FloraConnect API: http://localhost:${port}/api/health`);
});
