import app from './app.js';
import { getPort } from './config/env.js';

const port = getPort();
// Only local/standalone execution listens; Vercel imports src/app.ts.
app.listen(port, () => {
  console.log(`FloraConnect API: http://localhost:${port}/api/health`);
});
