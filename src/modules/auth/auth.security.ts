import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextFunction, Request, Response } from "express";
import { getAllowedOrigins } from "../../config/env.js";
import { connectDB } from "../../config/database.js";
import { AuthThrottle, Session, User, type Role } from "./auth.models.js";
import { effectivePermissions, type Permission } from "./auth.permissions.js";

const derive = promisify(scrypt);
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await derive(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !/^[a-f0-9]{128}$/.test(hash ?? ""))
    return false;
  const actual = (await derive(password, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(hash, "hex"));
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function text(value: unknown, label: string, max = 200) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new HttpError(400, `Provide a valid ${label}.`);
  return value.trim();
}
export function email(value: unknown) {
  const result = text(value, "email address", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))
    throw new HttpError(400, "Provide a valid email address.");
  return result;
}
export function password(value: unknown) {
  if (typeof value !== "string" || value.length < 8 || value.length > 128)
    throw new HttpError(400, "Use a password between 8 and 128 characters.");
  return value;
}
export function publicUser(user: {
  _id: unknown;
  publicId?: string | null;
  createdAt?: Date;
  name: string;
  email: string;
  role: string;
  permissions?: string[] | null;
  status?: string | null;
  emailVerified?: boolean | null;
  mustChangePassword?: boolean | null;
  accountType?: string | null;
  phone?: string | null;
  address?: string | null;
}) {
  return {
    id: user.publicId,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: effectivePermissions(user),
    status: user.status,
    emailVerified: user.emailVerified,
    mustChangePassword: user.mustChangePassword,
    accountType: user.accountType,
    phone: user.phone ?? "",
    address: user.address ?? "",
    createdAt: user.createdAt,
  };
}
export const cookieName = "floraconnect_session";
export function sessionCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || !!process.env.VERCEL,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
}
export function readSession(req: Request) {
  const token = req.headers.cookie
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = readSession(req);
    if (!token) throw new HttpError(401, "Please sign in to continue.");
    await connectDB();
    const session = await Session.findOne({
      tokenHash: digest(token),
      expiresAt: { $gt: new Date() },
    });
    if (!session)
      throw new HttpError(
        401,
        "Your session has expired. Please sign in again.",
      );
    const user = await User.findById(session.userId);
    if (!user || user.status !== "ACTIVE" || !user.emailVerified)
      throw new HttpError(403, "This account is not active.");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("X-CSRF-Token") !== session.csrfToken
    )
      throw new HttpError(403, "Refresh the page and try again.");
    res.locals.user = user;
    res.locals.session = session;
    next();
  } catch (error) {
    next(error);
  }
}
export function requireRoles(...roles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;
    if (!user || !roles.includes(user.role))
      return next(
        new HttpError(403, "You do not have permission for this action."),
      );
    if (user.mustChangePassword)
      return next(
        new HttpError(
          403,
          "Change your temporary password before using administration.",
        ),
      );
    next();
  };
}
export function requireTrustedOrigin(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("Origin");
  if (!origin || !getAllowedOrigins().includes(origin))
    return next(new HttpError(403, "This request origin is not allowed."));
  if (!req.is("application/json"))
    return next(new HttpError(415, "Send application/json."));
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body))
    return next(new HttpError(400, "Send a JSON object."));
  next();
}
export function requirePermission(permission: Permission) {
  return (_req: Request, res: Response, next: NextFunction) => {
    if (
      !res.locals.user ||
      !effectivePermissions(res.locals.user).includes(permission)
    )
      return next(
        new HttpError(
          403,
          "Your account does not have permission for this action.",
        ),
      );
    next();
  };
}
export async function throttle(req: Request, scope: string, limit = 20) {
  const window = Math.floor(Date.now() / 900000);
  const keys = [digest(`${scope}:${req.ip}:${window}`)];
  if (scope === "login" && typeof req.body?.email === "string")
    keys.push(digest(`${scope}:${req.body.email.toLowerCase()}:${window}`));
  for (const key of keys) {
    const attempt = await AuthThrottle.findOneAndUpdate(
      { key },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(Date.now() + 1800000) },
      },
      { upsert: true, returnDocument: "after" },
    );
    if (attempt.count > limit)
      throw new HttpError(
        429,
        "Too many attempts. Please try again in 15 minutes.",
      );
  }
}
