import { Router } from "express";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "../../config/database.js";
import {
  Application,
  AuditLog,
  Session,
  User,
  organizationTypes,
  positions,
} from "./auth.models.js";
import {
  HttpError,
  cookieName,
  digest,
  email,
  hashPassword,
  password,
  publicUser,
  readSession,
  requireTrustedOrigin,
  requireUser,
  sessionCookie,
  text,
  throttle,
  verifyPassword,
} from "./auth.security.js";

import { sendVerification } from "./auth.email.js";

export const authRouter = Router();
authRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
authRouter.use(requireTrustedOrigin);
authRouter.post("/register", async (req, res) => {
  await connectDB();
  await throttle(req, "register", 10);
  const allowed = [
    "name",
    "email",
    "password",
    "registrationKind",
    "application",
  ];
  if (Object.keys(req.body).some((key) => !allowed.includes(key)))
    throw new HttpError(
      400,
      "Registration accepts personal details and application information only.",
    );
  const name = text(req.body.name, "name", 100);
  const address = email(req.body.email);
  const secret = password(req.body.password);
  const registrationKinds = {
    personal: "USER",
    florist: "FLORIST",
    grower: "GROWER",
    organization: "ORGANIZATION_REPRESENTATIVE",
  } as const;
  const kind = req.body.registrationKind ?? "personal";
  if (typeof kind !== "string" || !Object.hasOwn(registrationKinds, kind))
    throw new HttpError(400, "Choose a supported registration path.");
  const type = registrationKinds[kind as keyof typeof registrationKinds];
  const details = req.body.application;
  let application: Record<string, unknown> | undefined;
  if (type === "USER" && details !== undefined)
    throw new HttpError(
      400,
      "Personal registration does not accept an application.",
    );
  if (type !== "USER") {
    if (!details || typeof details !== "object" || Array.isArray(details))
      throw new HttpError(
        400,
        "Provide your business or organization details.",
      );
    const allowedDetails = [
      "name",
      "contact",
      "location",
      "evidenceUrl",
      ...(type === "ORGANIZATION_REPRESENTATIVE"
        ? ["organizationType", "position"]
        : []),
    ];
    if (Object.keys(details).some((key) => !allowedDetails.includes(key)))
      throw new HttpError(400, "Unsupported application fields.");
    application = {
      type,
      name: text(details.name, "business or organization name", 150),
      contact: text(details.contact, "contact details"),
      location: text(details.location, "location"),
      evidenceUrl: text(details.evidenceUrl, "supporting evidence URL", 1000),
    };
    let url: URL;
    try {
      url = new URL(application.evidenceUrl as string);
    } catch {
      throw new HttpError(400, "Provide an HTTPS supporting evidence URL.");
    }
    if (url.protocol !== "https:" || url.username || url.password)
      throw new HttpError(400, "Provide an HTTPS supporting evidence URL.");
    if (type === "ORGANIZATION_REPRESENTATIVE") {
      if (
        !organizationTypes.includes(details.organizationType) ||
        !positions.includes(details.position)
      )
        throw new HttpError(
          400,
          "Select your organization category and position.",
        );
      application.organizationType = details.organizationType;
      application.position = details.position;
    }
  }
  const passwordHash = await hashPassword(secret);
  let createdUserId: mongoose.Types.ObjectId | undefined;
  try {
    await mongoose.connection.transaction(async (session) => {
      const [user] = await User.create(
        [
          {
            name,
            email: address,
            passwordHash,
            role: "USER",
            accountType: type,
            status: "PENDING_EMAIL_VERIFICATION",
          },
        ],
        { session },
      );
      createdUserId = user._id;
      if (application)
        await Application.create([{ ...application, userId: user._id }], {
          session,
        });
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new HttpError(
        409,
        "Unable to register this email. Try signing in or contact support.",
      );
    throw error;
  }
  const delivered = await sendVerification(createdUserId, address).catch(
    () => false,
  );
  res.status(201).json({
    message: delivered
      ? "Account registered. Check your email to verify your account. Business and organization access also requires administrator approval."
      : "Account registered and awaiting email verification. Email delivery is currently unavailable; please contact the platform team or request a new verification email later. No management access has been granted.",
    status: "PENDING_EMAIL_VERIFICATION",
  });
});
authRouter.post("/login", async (req, res) => {
  await connectDB();
  await throttle(req, "login");
  const address = email(req.body.email);
  if (typeof req.body.password !== "string" || req.body.password.length > 128)
    throw new HttpError(400, "Provide your password.");
  const user = await User.findOne({ email: address }).select("+passwordHash");
  // Always run password derivation, including for unknown email addresses.
  const fallback = "scrypt:00000000000000000000000000000000:" + "0".repeat(128);
  const valid = await verifyPassword(
    req.body.password,
    user?.passwordHash ?? fallback,
  );
  if (!user || !valid)
    throw new HttpError(401, "Email or password is incorrect.");
  if (!user.emailVerified || user.status !== "ACTIVE")
    throw new HttpError(
      403,
      "Your account is awaiting email verification or has been suspended.",
    );
  const old = readSession(req);
  if (old) await Session.deleteOne({ tokenHash: digest(old) });
  const token = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(32).toString("hex");
  await Session.create({
    tokenHash: digest(token),
    userId: user._id,
    csrfToken,
    expiresAt: new Date(Date.now() + 28800000),
  });
  res.cookie(cookieName, token, sessionCookie());
  res.json({ user: publicUser(user), csrfToken });
});
authRouter.get("/me", requireUser, (_req, res) => {
  res.json({
    user: publicUser(res.locals.user),
    csrfToken: res.locals.session.csrfToken,
  });
});
authRouter.post("/logout", requireUser, async (_req, res) => {
  await Session.deleteOne({ _id: res.locals.session._id });
  res.clearCookie(cookieName, sessionCookie());
  res.status(204).end();
});
authRouter.post("/password", requireUser, async (req, res) => {
  await throttle(req, "password", 10);
  const nextPassword = password(req.body.newPassword);
  if (
    typeof req.body.currentPassword !== "string" ||
    req.body.currentPassword.length > 128
  )
    throw new HttpError(400, "Provide your current password.");
  const user = await User.findById(res.locals.user._id).select("+passwordHash");
  if (
    !user ||
    !(await verifyPassword(req.body.currentPassword, user.passwordHash))
  )
    throw new HttpError(401, "Current password is incorrect.");
  if (nextPassword === req.body.currentPassword)
    throw new HttpError(400, "Choose a different password.");
  const passwordHash = await hashPassword(nextPassword);
  await mongoose.connection.transaction(async (session) => {
    await User.updateOne(
      { _id: user._id },
      { passwordHash, mustChangePassword: false },
      { session },
    );
    await Session.deleteMany({ userId: user._id }, { session });
    await AuditLog.create(
      [
        {
          actorId: user._id,
          action: "PASSWORD_CHANGED",
          targetId: user._id,
          details: "Password changed; all sessions revoked.",
        },
      ],
      { session },
    );
  });
  res.clearCookie(cookieName, sessionCookie());
  res.json({ message: "Password updated. Please sign in again." });
});

authRouter.patch("/profile", requireUser, async (req, res) => {
  if (
    Object.keys(req.body).some(
      (key) => !["name", "phone", "address"].includes(key),
    )
  )
    throw new HttpError(
      400,
      "Only personal profile fields can be changed here.",
    );
  const name = text(req.body.name, "name", 100);
  const updates: Record<string, string> = { name };
  for (const [field, limit] of [
    ["phone", 30],
    ["address", 300],
  ] as const) {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] !== "string" || req.body[field].length > limit)
        throw new HttpError(400, `Provide a valid ${field}.`);
      updates[field] = req.body[field].trim();
    }
  }
  const user = await User.findByIdAndUpdate(res.locals.user._id, updates, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!user) throw new HttpError(404, "Account not found.");
  res.json({ user: publicUser(user) });
});

authRouter.post("/verify-email", async (req, res) => {
  await connectDB();
  await throttle(req, "verify-email");
  if (
    typeof req.body.token !== "string" ||
    !/^[a-f0-9]{64}$/.test(req.body.token)
  )
    throw new HttpError(400, "Invalid verification link.");
  const user = await User.findOneAndUpdate(
    {
      verificationTokenHash: digest(req.body.token),
      verificationExpiresAt: { $gt: new Date() },
      emailVerified: false,
      status: "PENDING_EMAIL_VERIFICATION",
    },
    {
      $set: { emailVerified: true, status: "ACTIVE" },
      $unset: { verificationTokenHash: "", verificationExpiresAt: "" },
    },
    { returnDocument: "after" },
  );
  if (!user)
    throw new HttpError(
      400,
      "This verification link is invalid, expired or already used.",
    );
  res.json({
    message:
      "Email verified. You can now sign in. Business and organization applications still require approval.",
  });
});
authRouter.post("/resend-verification", async (req, res) => {
  await connectDB();
  await throttle(req, "resend-verification", 5);
  const address = email(req.body.email);
  if (
    !process.env.VERIFICATION_EMAIL_WEBHOOK ||
    !process.env.VERIFICATION_EMAIL_WEBHOOK_TOKEN
  )
    throw new HttpError(
      503,
      "Verification email delivery is currently unavailable. Please contact the platform team.",
    );
  const user = await User.findOne({
    email: address,
    emailVerified: false,
    status: "PENDING_EMAIL_VERIFICATION",
  });
  if (user) await sendVerification(user._id, address);
  res.json({
    message:
      "If this account needs verification, a new email has been requested.",
  });
});
