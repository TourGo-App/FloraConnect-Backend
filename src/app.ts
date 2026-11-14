import {
  DatabaseConfigurationError,
  DatabaseUnavailableError,
} from "./config/database.errors.js";
import express, { type ErrorRequestHandler } from "express";
import { HttpError } from "./modules/auth/auth.security.js";
import { frontendCors } from "./middleware/cors.js";
import { notFound } from "./middleware/not-found.js";
import { apiRouter } from "./routes/index.js";

const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  if (process.env.NODE_ENV === "production" || process.env.VERCEL)
    res.set("Strict-Transport-Security", "max-age=31536000");
  next();
});
app.use(frontendCors);
app.use(express.json({ limit: "32kb" }));
app.get("/", (_req, res) => {
  res.redirect("/api/health");
});
app.use("/api", apiRouter);
app.use(notFound);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (
    error instanceof DatabaseConfigurationError ||
    error instanceof DatabaseUnavailableError
  ) {
    res.set("Cache-Control", "no-store");
    if (error instanceof DatabaseConfigurationError)
      console.error(
        "Database configuration missing or invalid. Set MONGODB_URI in the backend deployment environment.",
      );
    res.status(503).json({
      code: error.code,
      message:
        error instanceof DatabaseConfigurationError
          ? "Sign-in is temporarily unavailable because the service database has not been configured."
          : error.message,
    });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON body." });
    return;
  }
  if (error?.type === "entity.too.large") {
    res.status(413).json({ message: "Request is too large." });
    return;
  }
  res
    .status(503)
    .json({ message: "Service temporarily unavailable. Please try again." });
};
app.use(errorHandler);
export default app;
