import { DatabaseConfigurationError } from './database.errors.js';

export function getPort(): number {
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  return port;
}

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  const onVercel = Boolean(process.env.VERCEL);
  if (uri) {
    if (!/^mongodb(?:\+srv)?:\/\//.test(uri) || /\s/.test(uri))
      throw new DatabaseConfigurationError();
    const authority = uri
      .replace(/^mongodb(?:\+srv)?:\/\//, '')
      .split(/[/?]/, 1)[0];
    const hosts = authority.slice(authority.lastIndexOf('@') + 1).split(',');
    if (!authority || hosts.some((host) => !host))
      throw new DatabaseConfigurationError();
    if (
      onVercel &&
      hosts.some((host) =>
        /^(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])(?::\d+)?$/i.test(
          host,
        ),
      )
    )
      throw new DatabaseConfigurationError();
    return uri;
  }
  if (process.env.NODE_ENV === 'production' || onVercel)
    throw new DatabaseConfigurationError();
  return 'mongodb://localhost:27017/floraconnect';
}

export const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ??
  'https://flora-connect-frontend.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
