import { userAccessRouter } from "./user-access.routes.js";
import { Router } from "express";
import mongoose from "mongoose";
import {
  User,
  Application,
  Organization,
  Membership,
  Business,
  AuditLog,
  roles,
} from "../auth/auth.models.js";
import {
  HttpError,
  publicUser,
  requireRoles,
  text,
} from "../auth/auth.security.js";
import { applicationView, auditView, isPublicId } from "./identifiers.js";

export const consoleRouter = Router();
consoleRouter.use(requireRoles("SUPER_ADMIN"));

function filters(query: Record<string, unknown>, fields: string[]) {
  const filter: Record<string, unknown> = {};
  const search =
    typeof query.search === "string" ? query.search.trim().slice(0, 150) : "";
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = fields.map((field) => ({
      [field]: { $regex: escaped, $options: "i" },
    }));
    if (isPublicId(search))
      (filter.$or as unknown[]).push({ publicId: search });
  }
  for (const key of ["status", "role", "type"]) {
    if (typeof query[key] === "string" && query[key])
      filter[key] = query[key].slice(0, 100);
  }
  if (query.verified === "true" || query.verified === "false")
    filter.emailVerified = query.verified === "true";
  return filter;
}
const resources = {
  users: { model: User, fields: ["name", "email"], view: publicUser },
  applications: {
    model: Application,
    fields: ["name", "contact"],
    view: applicationView,
  },
  organizations: {
    model: Organization,
    fields: ["name", "contact", "location"],
    view: (r: any) => ({
      id: r.publicId,
      name: r.name,
      type: r.type,
      contact: r.contact,
      location: r.location,
      status: r.status,
      createdAt: r.createdAt,
    }),
  },
  businesses: {
    model: Business,
    fields: ["name", "contact", "location"],
    view: (r: any) => ({
      id: r.publicId,
      name: r.name,
      type: r.type,
      contact: r.contact,
      location: r.location,
      status: r.status,
      createdAt: r.createdAt,
    }),
  },
  "audit-logs": {
    model: AuditLog,
    fields: ["action", "details"],
    view: auditView,
  },
};

consoleRouter.post("/records/:resource/query", async (req, res) => {
  const key = req.params.resource as keyof typeof resources;
  const resource = resources[key];
  if (!Object.hasOwn(resources, key))
    throw new HttpError(404, "Resource unavailable.");
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(req.body.page) || 1)),
  );
  const filter = filters(req.body, resource.fields);
  const sort: Record<string, 1 | -1> =
    req.body.sort === "name" && key !== "audit-logs"
      ? { name: 1 as const, _id: 1 as const }
      : { createdAt: -1 as const, _id: -1 as const };
  // Models have distinct document types; the query is intentionally shared over safe filters.
  const model = resource.model as mongoose.Model<any>;
  let query = model
    .find(filter)
    .sort(sort)
    .skip((page - 1) * 20)
    .limit(20);
  if (key === "applications")
    query = query.populate(
      "userId",
      "publicId name email emailVerified status",
    );
  const [records, total] = await Promise.all([
    query.lean(),
    model.countDocuments(filter),
  ]);
  res.json({
    records: records.map(resource.view as (r: any) => unknown),
    page,
    total,
    pageSize: 20,
  });
});

consoleRouter.get("/summary", async (_req, res) => {
  const [
    users,
    active,
    unverified,
    organizations,
    florists,
    growers,
    pendingOrganizations,
    pendingFlorists,
    pendingGrowers,
    audit,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "ACTIVE" }),
    User.countDocuments({ emailVerified: false }),
    Organization.countDocuments(),
    Business.countDocuments({ type: "FLORIST" }),
    Business.countDocuments({ type: "GROWER" }),
    Application.countDocuments({
      status: "PENDING",
      type: "ORGANIZATION_REPRESENTATIVE",
    }),
    Application.countDocuments({ status: "PENDING", type: "FLORIST" }),
    Application.countDocuments({ status: "PENDING", type: "GROWER" }),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
  ]);
  res.json({
    counts: {
      users,
      active,
      unverified,
      organizations,
      florists,
      growers,
      pendingOrganizations,
      pendingFlorists,
      pendingGrowers,
    },
    audit: audit.map(auditView),
  });
});

consoleRouter.get("/analytics", async (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days))
    ? Number(req.query.days)
    : 30;
  const end = req.query.to ? new Date(String(req.query.to)) : new Date();
  const start = req.query.from
    ? new Date(String(req.query.from))
    : new Date(end.getTime() - (days - 1) * 86400000);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);
  if (
    !Number.isFinite(+start) ||
    !Number.isFinite(+end) ||
    start > end ||
    +end - +start > 366 * 86400000
  )
    throw new HttpError(400, "Choose a date range of up to one year.");
  const trend = (model: mongoose.Model<any>) =>
    model.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Colombo",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  const [users, organizations, businesses, byRole] = await Promise.all([
    trend(User),
    trend(Organization),
    trend(Business),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
  ]);
  res.json({ users, organizations, businesses, byRole, from: start, to: end });
});

consoleRouter.get("/roles", async (_req, res) => {
  const counts = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } },
  ]);
  res.json({
    records: roles.map((role) => ({
      id: role,
      name: role,
      count: counts.find((r) => r._id === role)?.count ?? 0,
      type: "System",
    })),
  });
});

consoleRouter.get("/users/:id/links", async (req, res) => {
  if (!isPublicId(req.params.id))
    throw new HttpError(400, "Invalid user identifier.");
  const user = await User.findOne({ publicId: req.params.id });
  if (!user) throw new HttpError(404, "User not found.");
  const [memberships, businesses] = await Promise.all([
    Membership.find({ userId: user._id }).limit(20).lean(),
    Business.find({ ownerId: user._id }).limit(20).lean(),
  ]);
  res.json({
    memberships: memberships.map((m) => ({
      id: m.publicId,
      role: m.role,
      position: m.position,
      status: m.status,
    })),
    businesses: businesses.map((b) => ({
      id: b.publicId,
      name: b.name,
      type: b.type,
      status: b.status,
    })),
  });
});

consoleRouter.patch("/users/:id", async (req, res) => {
  if (!isPublicId(req.params.id))
    throw new HttpError(400, "Invalid user identifier.");
  if (
    Object.keys(req.body).some(
      (key) => !["name", "phone", "address", "reason"].includes(key),
    )
  )
    throw new HttpError(400, "Only personal details may be edited.");
  const updates = {
    name: text(req.body.name, "name", 100),
    phone: String(req.body.phone ?? "").trim(),
    address: String(req.body.address ?? "").trim(),
  };
  if (
    updates.phone.length > 30 ||
    (updates.phone && !/^[+\d\s().-]{5,30}$/.test(updates.phone)) ||
    updates.address.length > 300
  )
    throw new HttpError(400, "Provide a valid phone number and address.");
  const reason = text(req.body.reason, "edit reason", 1000);
  await mongoose.connection.transaction(async (session) => {
    const user = await User.findOne({ publicId: req.params.id }).session(
      session,
    );
    if (!user) throw new HttpError(404, "User not found.");
    if (user.role === "SUPER_ADMIN")
      throw new HttpError(
        409,
        "Use the authenticated profile flow for administrator details.",
      );
    Object.assign(user, updates);
    await user.save({ session });
    await AuditLog.create(
      [
        {
          actorId: res.locals.user._id,
          targetId: user._id,
          action: "USER_PROFILE_EDITED",
          details: reason,
        },
      ],
      { session },
    );
  });
  res.json({ message: "Personal details updated." });
});

consoleRouter.use(userAccessRouter);
