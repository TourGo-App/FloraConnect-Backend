import cors from "cors";
import type { RequestHandler } from "express";
import { getAllowedOrigins, OriginConfigurationError } from "../config/env.js";

export const frontendCors: RequestHandler = (req, res, next) => {
  try {
    return cors({ origin: getAllowedOrigins(), credentials: true })(
      req,
      res,
      next,
    );
  } catch (error) {
    // Liveness must survive deployment configuration errors. Do not grant CORS
    // headers or permit application requests when configuration is invalid.
    if (
      error instanceof OriginConfigurationError &&
      ["GET", "HEAD"].includes(req.method) &&
      ["/", "/api/health", "/api/health/"].includes(req.path)
    )
      return next();
    return next(error);
  }
};
