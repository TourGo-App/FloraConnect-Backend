import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import {
  AdministrationLock,
  Application,
  AuditLog,
  Business,
  Membership,
  Organization,
  Session,
  User,
  positions,
  roles,
  type Role,
} from "../auth/auth.models.js";
import {
  permissionCatalog,
  rolePolicy,
  effectivePermissions,
  type Permission,
} from "../auth/auth.permissions.js";
import {
  HttpError,
  email,
  hashPassword,
  password,
  publicUser,
  requireRoles,
  text,
  throttle,
  verifyPassword,
} from "../auth/auth.security.js";
import { sendVerification } from "../auth/auth.email.js";
import { isPublicId } from "./identifiers.js";

export const userAccessRouter = Router();
userAccessRouter.use(requireRoles("SUPER_ADMIN"));

userAccessRouter.get("/access-policy", (_req, res) => {
  res.json({
    roles: roles.map((id) => ({ id, ...rolePolicy[id] })),
    permissions: permissionCatalog,
  });
});

function allowedFields(body: Record<string, unknown>, fields: string[]) {
  if (Object.keys(body).some((key) => !fields.includes(key)))
    throw new HttpError(400, "Unsupported account fields.");
}
function accessInput(body: Record<string, unknown>) {
  if (typeof body.role !== "string" || !roles.includes(body.role as Role))
    throw new HttpError(400, "Select a supported system role.");
  const role = body.role as Role;
  if (
    !Array.isArray(body.permissions) ||
    body.permissions.some(
      (id) =>
        typeof id !== "string" ||
        !rolePolicy[role].permissions.includes(id as Permission),
    )
  )
    throw new HttpError(400, "Permissions must stay within the selected role.");
  const mandatory = permissionCatalog
    .filter((p) => !p.configurable)
    .map((p) => p.id);
  if (
    role === "SUPER_ADMIN" &&
    !rolePolicy.SUPER_ADMIN.permissions.every((id) =>
      (body.permissions as string[]).includes(id),
    )
  )
    throw new HttpError(400, "Super Admin permissions cannot be restricted.");
  const permissions =
    role === "SUPER_ADMIN"
      ? [...rolePolicy[role].permissions]
      : ([...new Set([...mandatory, ...body.permissions])] as Permission[]);
  if (
    permissions.includes("applications.review") &&
    !permissions.includes("applications.read")
  )
    throw new HttpError(
      400,
      "Application review also requires permission to view applications.",
    );
  const organizationRole = [
    "ORGANIZATION_ADMIN",
    "ORGANIZATION_MEMBER",
  ].includes(role);
  let organization:
    { id: string; position: (typeof positions)[number] } | undefined;
  if (organizationRole) {
    if (
      !isPublicId(body.organizationId) ||
      !positions.includes(body.position as (typeof positions)[number])
    )
      throw new HttpError(
        400,
        "Choose an approved organization and a valid organization position.",
      );
    organization = {
      id: body.organizationId,
      position: body.position as (typeof positions)[number],
    };
  } else if (body.organizationId !== undefined || body.position !== undefined)
    throw new HttpError(
      400,
      "Organization assignments require an organization role.",
    );
  let business: { name: string; contact: string; location: string } | undefined;
  if (role === "FLORIST" || role === "GROWER") {
    if (
      !body.business ||
      typeof body.business !== "object" ||
      Array.isArray(body.business)
    )
      throw new HttpError(400, "Business roles require business details.");
    const fields = body.business as Record<string, unknown>;
    allowedFields(fields, ["name", "contact", "location"]);
    business = {
      name: text(fields.name, "business name", 150),
      contact: text(fields.contact, "business contact", 200),
      location: text(fields.location, "business location", 200),
    };
  } else if (body.business !== undefined)
    throw new HttpError(
      400,
      "Business details require a florist or grower role.",
    );
  return { role, permissions, organization, business };
}

async function privilegedTransaction<T>(
  req: Request,
  res: Response,
  operation: (session: mongoose.ClientSession) => Promise<T>,
): Promise<T> {
  await throttle(req, `access-management:${res.locals.user._id}`, 20);
  if (
    typeof req.body.currentPassword !== "string" ||
    !req.body.currentPassword ||
    req.body.currentPassword.length > 128
  )
    throw new HttpError(400, "Confirm your current password.");
  // A shared write serializes role changes, preventing two admins from
  // concurrently demoting each other and bypassing last-Super-Admin checks.
  await AdministrationLock.init();
  try {
    await AdministrationLock.updateOne(
      { _id: "user-access" },
      { $setOnInsert: { revision: 0 } },
      { upsert: true },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
  }
  return mongoose.connection.transaction(async (session) => {
    await AdministrationLock.updateOne(
      { _id: "user-access" },
      { $inc: { revision: 1 } },
      { session },
    );
    const actor = await User.findById(res.locals.user._id)
      .select("+passwordHash")
      .session(session);
    if (
      !actor ||
      actor.role !== "SUPER_ADMIN" ||
      actor.status !== "ACTIVE" ||
      !actor.emailVerified ||
      actor.mustChangePassword
    )
      throw new HttpError(403, "An active Super Admin account is required.");
    if (!(await verifyPassword(req.body.currentPassword, actor.passwordHash)))
      throw new HttpError(401, "Current password is incorrect.");
    return operation(session);
  });
}

type AccessInput = ReturnType<typeof accessInput>;
async function assignContext(
  user: InstanceType<typeof User>,
  input: AccessInput,
  session: mongoose.ClientSession,
) {
  const organization = input.organization
    ? await Organization.findOne({
        publicId: input.organization.id,
        status: "APPROVED",
      }).session(session)
    : null;
  if (input.organization && !organization)
    throw new HttpError(
      409,
      "The selected organization is not approved or no longer exists.",
    );
  const memberships = await Membership.find({
    userId: user._id,
    status: "ACTIVE",
  }).session(session);
  const sameOrganizationRole =
    input.organization &&
    user.role === input.role &&
    organization &&
    memberships.some(
      (membership) =>
        String(membership.organizationId) === String(organization._id) &&
        membership.role === input.role,
    );
  if (memberships.length > 1 && !sameOrganizationRole)
    throw new HttpError(
      409,
      "This account has multiple organization memberships. Manage those memberships before replacing its organization role.",
    );
  for (const membership of memberships) {
    const retainingAdmin =
      input.role === "ORGANIZATION_ADMIN" &&
      organization &&
      String(organization._id) === String(membership.organizationId);
    if (
      !sameOrganizationRole &&
      membership.role === "ORGANIZATION_ADMIN" &&
      !retainingAdmin
    ) {
      const others = await Membership.countDocuments({
        organizationId: membership.organizationId,
        userId: { $ne: user._id },
        role: "ORGANIZATION_ADMIN",
        status: "ACTIVE",
      }).session(session);
      if (!others)
        throw new HttpError(
          409,
          "Assign another administrator to this organization before removing its last admin.",
        );
    }
  }
  if (!sameOrganizationRole)
    await Membership.updateMany(
      { userId: user._id, status: "ACTIVE" },
      { status: "REMOVED" },
      { session },
    );
  if (organization && input.organization) {
    await Membership.findOneAndUpdate(
      { userId: user._id, organizationId: organization._id },
      {
        $set: {
          role: input.role,
          position: input.organization.position,
          status: "ACTIVE",
        },
      },
      { upsert: true, session, runValidators: true, setDefaultsOnInsert: true },
    );
  }
  if (input.business) {
    const existingBusiness = await Business.findOne({
      ownerId: user._id,
    }).session(session);
    await Business.findOneAndUpdate(
      { ownerId: user._id },
      {
        $set: {
          ...input.business,
          type: input.role,
          status: existingBusiness?.status ?? "APPROVED",
        },
      },
      { upsert: true, session, runValidators: true, setDefaultsOnInsert: true },
    );
  } else {
    await Business.updateMany(
      { ownerId: user._id, status: "APPROVED" },
      { status: "SUSPENDED" },
      { session },
    );
  }
}

userAccessRouter.get("/users/:id/access", async (req, res) => {
  if (!isPublicId(req.params.id))
    throw new HttpError(400, "Invalid user identifier.");
  const user = await User.findOne({ publicId: req.params.id });
  if (!user) throw new HttpError(404, "User not found.");
  const [membership, business] = await Promise.all([
    user.role === "ORGANIZATION_ADMIN" || user.role === "ORGANIZATION_MEMBER"
      ? Membership.findOne({ userId: user._id, status: "ACTIVE", role: user.role }).lean()
      : Promise.resolve(null),
    Business.findOne({ ownerId: user._id }).lean(),
  ]);
  const organization = membership
    ? await Organization.findById(membership.organizationId).lean()
    : null;
  res.json({
    user: publicUser(user),
    organizationId: organization?.publicId,
    organizationName: organization?.name,
    position: membership?.position,
    business: business
      ? {
          name: business.name,
          contact: business.contact,
          location: business.location,
        }
      : undefined,
  });
});

userAccessRouter.post("/users", async (req, res) => {
  allowedFields(req.body, [
    "name",
    "email",
    "phone",
    "temporaryPassword",
    "currentPassword",
    "reason",
    "role",
    "permissions",
    "organizationId",
    "position",
    "business",
    "confirmSuperAdmin",
  ]);
  const input = accessInput(req.body);
  if (input.role === "SUPER_ADMIN" && req.body.confirmSuperAdmin !== true)
    throw new HttpError(400, "Explicitly confirm the Super Admin grant.");
  const name = text(req.body.name, "full name", 100);
  const address = email(req.body.email);
  const temporary = password(req.body.temporaryPassword);
  const phone = req.body.phone ?? "";
  if (
    typeof phone !== "string" ||
    phone.length > 30 ||
    (phone && !/^[+\d\s().-]{5,30}$/.test(phone))
  )
    throw new HttpError(400, "Provide a valid phone number.");
  const reason = text(req.body.reason, "creation reason", 1000);
  let user: InstanceType<typeof User>;
  try {
    user = await privilegedTransaction(req, res, async (session) => {
      const [created] = await User.create(
        [
          {
            name,
            email: address,
            phone,
            passwordHash: await hashPassword(temporary),
            role: input.role,
            permissions: input.permissions,
            status: "PENDING_EMAIL_VERIFICATION",
            emailVerified: false,
            mustChangePassword: true,
            accountType:
              input.role === "FLORIST" || input.role === "GROWER"
                ? input.role
                : input.organization
                  ? "ORGANIZATION_REPRESENTATIVE"
                  : "USER",
          },
        ],
        { session },
      );
      await assignContext(created, input, session);
      await AuditLog.create(
        [
          {
            actorId: res.locals.user._id,
            targetId: created._id,
            action: "ADMIN_USER_CREATED",
            details: JSON.stringify({
              reason,
              role: input.role,
              permissions: input.permissions,
              organizationId: input.organization?.id,
              businessType: input.business ? input.role : undefined,
              activation: "EMAIL_VERIFICATION_AND_PASSWORD_CHANGE_REQUIRED",
            }),
          },
        ],
        { session },
      );
      return created;
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000)
      throw new HttpError(
        409,
        "This email or linked account record already exists.",
      );
    throw error;
  }
  const verificationSent = await sendVerification(user._id, user.email).catch(
    () => false,
  );
  res.status(201).json({
    user: publicUser(user),
    verificationSent,
    message: verificationSent
      ? "User created. Email verification and a first-login password change are required."
      : "User created, pending email verification. Email delivery is unavailable; configure delivery before the user can sign in.",
  });
});

userAccessRouter.patch("/users/:id/access", async (req, res) => {
  if (!isPublicId(req.params.id))
    throw new HttpError(400, "Invalid user identifier.");
  allowedFields(req.body, [
    "role",
    "permissions",
    "organizationId",
    "position",
    "business",
    "currentPassword",
    "reason",
    "confirmSuperAdmin",
  ]);
  const input = accessInput(req.body);
  const reason = text(req.body.reason, "access change reason", 1000);
  await privilegedTransaction(req, res, async (session) => {
    const user = await User.findOne({ publicId: req.params.id }).session(
      session,
    );
    if (!user) throw new HttpError(404, "User not found.");
    if (String(user._id) === String(res.locals.user._id))
      throw new HttpError(409, "Another Super Admin must manage your access.");
    if (
      input.role === "SUPER_ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      req.body.confirmSuperAdmin !== true
    )
      throw new HttpError(400, "Explicitly confirm the Super Admin grant.");
    if (user.role === "SUPER_ADMIN" && input.role !== "SUPER_ADMIN") {
      const remaining = await User.countDocuments({
        _id: { $ne: user._id },
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        emailVerified: true,
        mustChangePassword: false,
      }).session(session);
      if (!remaining)
        throw new HttpError(
          409,
          "The last active Super Admin cannot be demoted.",
        );
    }
    if (
      await Application.exists({ userId: user._id, status: "PENDING" }).session(
        session,
      )
    )
      throw new HttpError(
        409,
        "Resolve the pending application before changing account access.",
      );
    const before = { role: user.role, permissions: effectivePermissions(user) };
    await assignContext(user, input, session);
    user.role = input.role;
    user.accountType =
      input.role === "FLORIST" || input.role === "GROWER"
        ? input.role
        : input.organization
          ? "ORGANIZATION_REPRESENTATIVE"
          : "USER";
    user.permissions = input.permissions;
    await user.save({ session });
    await Session.deleteMany({ userId: user._id }, { session });
    await AuditLog.create(
      [
        {
          actorId: res.locals.user._id,
          targetId: user._id,
          action: "USER_ACCESS_CHANGED",
          details: JSON.stringify({
            reason,
            before,
            after: { role: input.role, permissions: input.permissions },
            organizationId: input.organization?.id,
            businessType: input.business ? input.role : undefined,
          }),
        },
      ],
      { session },
    );
  });
  res.json({
    message:
      "Role and permissions updated. Existing sessions have been revoked.",
  });
});
