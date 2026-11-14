import { DatabaseConfigurationError } from "./database.errors.js";

export function getPort(): number {
  const port = Number(process.env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
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
      .replace(/^mongodb(?:\+srv)?:\/\//, "")
      .split(/[/?]/, 1)[0];
    const hosts = authority.slice(authority.lastIndexOf("@") + 1).split(",");
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
  if (process.env.NODE_ENV === "production" || onVercel)
    throw new DatabaseConfigurationError();
  return "mongodb://localhost:27017/floraconnect";
}

export class OriginConfigurationError extends Error {
  readonly code = "ORIGIN_NOT_CONFIGURED";
  constructor() {
    super(
      "FRONTEND_ORIGINS must contain exact allowed origins; production requires HTTPS.",
    );
  }
}

export function getAllowedOrigins(): string[] {
  const configured = process.env.FRONTEND_ORIGINS?.trim();
  const production =
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
  const values = configured
    ? configured.split(",")
    : production
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"];
  return values.map((entry) => {
    const value = entry.trim();
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new OriginConfigurationError();
    }
    if (
      url.origin !== value ||
      url.username ||
      url.password ||
      (production
        ? url.protocol !== "https:"
        : !["http:", "https:"].includes(url.protocol))
    )
      throw new OriginConfigurationError();
    return value;
  });
}
