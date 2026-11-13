import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../src/app.js";
import {
  AdministrationLock,
  Application,
  AuditLog,
  AuthThrottle,
  Business,
  Membership,
  Organization,
  Session,
  User,
} from "../../src/modules/auth/auth.models.js";
import { hashPassword } from "../../src/modules/auth/auth.security.js";
import { rolePolicy } from "../../src/modules/auth/auth.permissions.js";
import { sendVerification } from "../../src/modules/auth/auth.email.js";

vi.mock("../../src/config/database.js", () => ({
  connectDB: vi.fn().mockResolvedValue({}),
  isDbConnected: () => false,
}));
vi.mock("../../src/modules/auth/auth.email.js", () => ({
  sendVerification: vi.fn().mockResolvedValue(true),
}));
const origin = "http://localhost:5173";
const cookie = "floraconnect_session=" + "a".repeat(64);
const actor = {
  _id: new mongoose.Types.ObjectId(),
  publicId: "78ed06ba-8a40-4425-a430-a7d297f4a21c",
  name: "Admin",
  email: "admin@example.test",
  role: "SUPER_ADMIN",
  status: "ACTIVE",
  emailVerified: true,
  mustChangePassword: false,
  passwordHash: "",
};
const targetId = "10c45050-d898-4b52-935f-bfa5b991d391";
const organizationId = "f8048838-bb43-479a-81a3-a654d65f84f4";
const session = {} as mongoose.ClientSession;
let target: Record<string, any>;
const query = (value: unknown) =>
  Object.assign(Promise.resolve(value), { session: async () => value });
const baseInput = () => ({
  role: "USER",
  permissions: ["profile.read", "password.change", "profile.update"],
  reason: "Approved account provisioning",
  currentPassword: "admin-fixture-password",
  name: "New User",
  email: "new@example.test",
  phone: "",
  temporaryPassword: "eight888",
});
const create = (changes: Record<string, unknown> = {}) =>
  request(app)
    .post("/api/admin/console/users")
    .set("Cookie", cookie)
    .set("Origin", origin)
    .set("X-CSRF-Token", "csrf-fixture")
    .send({ ...baseInput(), ...changes });
const update = (changes: Record<string, unknown> = {}, id = targetId) => {
  const {
    name: _name,
    email: _email,
    phone: _phone,
    temporaryPassword: _password,
    ...input
  } = baseInput();
  return request(app)
    .patch(`/api/admin/console/users/${id}/access`)
    .set("Cookie", cookie)
    .set("Origin", origin)
    .set("X-CSRF-Token", "csrf-fixture")
    .send({ ...input, ...changes });
};
beforeAll(async () => {
  actor.passwordHash = await hashPassword("admin-fixture-password");
});
beforeEach(() => {
  target = {
    _id: new mongoose.Types.ObjectId(),
    publicId: targetId,
    name: "Member",
    email: "member@example.test",
    role: "USER",
    status: "ACTIVE",
    emailVerified: true,
    permissions: undefined,
    save: vi.fn().mockResolvedValue({}),
  };
  vi.spyOn(Session, "findOne").mockResolvedValue({
    userId: actor._id,
    csrfToken: "csrf-fixture",
  } as never);
  vi.spyOn(User, "findById").mockReturnValue(
    Object.assign(Promise.resolve(actor), {
      select: () => ({ session: async () => actor }),
    }) as never,
  );
  vi.spyOn(AuthThrottle, "findOneAndUpdate").mockResolvedValue({
    count: 1,
  } as never);
  vi.spyOn(AdministrationLock, "init").mockResolvedValue(
    AdministrationLock as never,
  );
  vi.spyOn(AdministrationLock, "updateOne").mockResolvedValue({
    acknowledged: true,
  } as never);
  vi.spyOn(mongoose.connection, "transaction").mockImplementation((async (
    operation: (s: mongoose.ClientSession) => Promise<unknown>,
  ) => operation(session)) as never);
  vi.spyOn(User, "findOne").mockImplementation(() => query(target) as never);
  vi.spyOn(User, "create").mockImplementation((async (
    docs: Record<string, unknown>[],
  ) => [new User(docs[0])]) as never);
  vi.spyOn(User, "countDocuments").mockReturnValue(query(1) as never);
  vi.spyOn(Application, "exists").mockReturnValue(query(null) as never);
  vi.spyOn(Membership, "find").mockReturnValue(query([]) as never);
  vi.spyOn(Membership, "updateMany").mockResolvedValue({
    acknowledged: true,
  } as never);
  vi.spyOn(Membership, "findOneAndUpdate").mockResolvedValue({} as never);
  vi.spyOn(Membership, "countDocuments").mockReturnValue(query(1) as never);
  vi.spyOn(Business, "findOne").mockReturnValue(query(null) as never);
  vi.spyOn(Business, "updateMany").mockResolvedValue({
    acknowledged: true,
  } as never);
  vi.spyOn(Business, "findOneAndUpdate").mockResolvedValue({} as never);
  vi.spyOn(Organization, "findOne").mockReturnValue(
    query({
      _id: new mongoose.Types.ObjectId(),
      publicId: organizationId,
      status: "APPROVED",
    }) as never,
  );
  vi.spyOn(AuditLog, "create").mockResolvedValue([] as never);
  vi.spyOn(Session, "deleteMany").mockResolvedValue({
    acknowledged: true,
  } as never);
  vi.mocked(sendVerification).mockReset().mockResolvedValue(true);
});
afterEach(() => vi.restoreAllMocks());

describe("Super Admin user provisioning", () => {
  it("requires an authenticated Super Admin for provisioning, policy and access changes", async () => {
    expect(
      (await request(app).get("/api/admin/console/access-policy")).status,
    ).toBe(401);
    for (const role of [
      "USER",
      "PLATFORM_ADMIN",
      "ORGANIZATION_ADMIN",
      "ORGANIZATION_MEMBER",
      "FLORIST",
      "GROWER",
    ]) {
      vi.mocked(User.findById).mockResolvedValue({ ...actor, role } as never);
      expect((await create()).status).toBe(403);
      expect((await update()).status).toBe(403);
      expect(
        (
          await request(app)
            .get("/api/admin/console/access-policy")
            .set("Cookie", cookie)
        ).status,
      ).toBe(403);
    }
    expect(User.create).not.toHaveBeenCalled();
  });
  it("publishes all seven role boundaries and only supported permissions", async () => {
    const response = await request(app)
      .get("/api/admin/console/access-policy")
      .set("Cookie", cookie);
    expect(response.status).toBe(200);
    expect(response.body.roles).toHaveLength(7);
    expect(
      response.body.roles.find((r: any) => r.id === "USER").permissions,
    ).not.toContain("users.create");
  });
  it("creates a real pending user with a hashed temporary password and safe audit data", async () => {
    const response = await create();
    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      role: "USER",
      emailVerified: false,
      status: "PENDING_EMAIL_VERIFICATION",
      mustChangePassword: true,
    });
    const doc = (
      vi.mocked(User.create).mock.calls[0][0] as unknown as Record<
        string,
        unknown
      >[]
    )[0];
    expect(doc.passwordHash).toMatch(/^scrypt:/);
    expect(JSON.stringify(response.body)).not.toContain("eight888");
    expect(JSON.stringify(vi.mocked(AuditLog.create).mock.calls)).not.toMatch(
      /eight888|admin-fixture-password|passwordHash/,
    );
    expect(sendVerification).toHaveBeenCalledOnce();
    expect(AdministrationLock.updateOne).toHaveBeenCalledWith(
      { _id: "user-access" },
      { $inc: { revision: 1 } },
      { session },
    );
  });
  it("keeps an account pending when email delivery is unavailable", async () => {
    vi.mocked(sendVerification).mockResolvedValue(false);
    const response = await create();
    expect(response.status).toBe(201);
    expect(response.body.verificationSent).toBe(false);
    expect(response.body.user.status).toBe("PENDING_EMAIL_VERIFICATION");
  });
  it.each([
    { currentPassword: "" },
    { reason: "" },
    { email: "bad-email" },
    { temporaryPassword: "short" },
    { role: "PRESIDENT" },
    { status: "ACTIVE" },
    { permissions: ["users.create"] },
    { permissions: ["unknown.permission"] },
  ])("rejects invalid provisioning input %j", async (fields) => {
    expect((await create(fields)).status).toBe(400);
    expect(User.create).not.toHaveBeenCalled();
  });
  it("requires current-password reauthentication before any creation", async () => {
    expect((await create({ currentPassword: "wrong-password" })).status).toBe(
      401,
    );
    expect(User.create).not.toHaveBeenCalled();
  });
  it("rejects duplicate email creation without leaking database errors", async () => {
    vi.mocked(User.create).mockRejectedValue({ code: 11000 });
    expect((await create()).status).toBe(409);
    expect(AuditLog.create).not.toHaveBeenCalled();
  });
  it("requires full permission selection and explicit confirmation for a Super Admin grant", async () => {
    expect(
      (await create({ role: "SUPER_ADMIN", confirmSuperAdmin: true })).status,
    ).toBe(400);
    expect(
      (
        await create({
          role: "SUPER_ADMIN",
          permissions: rolePolicy.SUPER_ADMIN.permissions,
        })
      ).status,
    ).toBe(400);
    expect(
      (
        await create({
          role: "SUPER_ADMIN",
          permissions: rolePolicy.SUPER_ADMIN.permissions,
          confirmSuperAdmin: true,
        })
      ).status,
    ).toBe(201);
  });
  it("requires and creates the matching florist business context", async () => {
    expect((await create({ role: "FLORIST" })).status).toBe(400);
    expect(
      (
        await create({
          role: "FLORIST",
          business: { name: "Shop", contact: "Contact", location: "City" },
        })
      ).status,
    ).toBe(201);
    expect(Business.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: expect.anything() }),
      {
        $set: {
          name: "Shop",
          contact: "Contact",
          location: "City",
          type: "FLORIST",
          status: "APPROVED",
        },
      },
      expect.objectContaining({ session, upsert: true }),
    );
  });
  it("requires approved organization membership and keeps position distinct from the role", async () => {
    expect((await create({ role: "ORGANIZATION_MEMBER" })).status).toBe(400);
    const result = await create({
      role: "ORGANIZATION_MEMBER",
      organizationId,
      position: "PRESIDENT",
    });
    expect(result.status).toBe(201);
    expect(result.body.user.role).toBe("ORGANIZATION_MEMBER");
    expect(Membership.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      {
        $set: {
          role: "ORGANIZATION_MEMBER",
          position: "PRESIDENT",
          status: "ACTIVE",
        },
      },
      expect.objectContaining({ session }),
    );
    vi.mocked(Organization.findOne).mockReturnValue(query(null) as never);
    expect(
      (
        await create({
          role: "ORGANIZATION_MEMBER",
          organizationId,
          position: "PRESIDENT",
        })
      ).status,
    ).toBe(409);
  });
});

describe("Role and permission updates", () => {
  it("persists bounded grants, revokes sessions, and audits before/after values", async () => {
    const response = await update({
      role: "PLATFORM_ADMIN",
      permissions: ["applications.read", "profile.read", "password.change"],
    });
    expect(response.status).toBe(200);
    expect(target.role).toBe("PLATFORM_ADMIN");
    expect(target.permissions).toContain("applications.read");
    expect(target.permissions).not.toContain("applications.review");
    expect(Session.deleteMany).toHaveBeenCalledWith(
      { userId: target._id },
      { session },
    );
    expect(JSON.stringify(vi.mocked(AuditLog.create).mock.calls)).toContain(
      "USER_ACCESS_CHANGED",
    );
    expect(JSON.stringify(vi.mocked(AuditLog.create).mock.calls)).not.toContain(
      "admin-fixture-password",
    );
  });
  it("blocks self-access changes and removal of the last active Super Admin", async () => {
    target._id = actor._id;
    expect((await update()).status).toBe(409);
    target._id = new mongoose.Types.ObjectId();
    target.role = "SUPER_ADMIN";
    vi.mocked(User.countDocuments).mockReturnValue(query(0) as never);
    expect((await update()).status).toBe(409);
    expect(target.save).not.toHaveBeenCalled();
  });
  it("rechecks the actor after acquiring the serialization lock", async () => {
    const oldActor = { ...actor, role: "USER" };
    vi.mocked(User.findById).mockReturnValue(
      Object.assign(Promise.resolve(actor), {
        select: () => ({ session: async () => oldActor }),
      }) as never,
    );
    expect((await update()).status).toBe(403);
    expect(target.save).not.toHaveBeenCalled();
  });
  it("protects pending applications and the last organization administrator", async () => {
    vi.mocked(Application.exists).mockReturnValue(
      query({ _id: target._id }) as never,
    );
    expect((await update()).status).toBe(409);
    vi.mocked(Application.exists).mockReturnValue(query(null) as never);
    vi.mocked(Membership.find).mockReturnValue(
      query([
        {
          userId: target._id,
          organizationId: new mongoose.Types.ObjectId(),
          role: "ORGANIZATION_ADMIN",
        },
      ]) as never,
    );
    vi.mocked(Membership.countDocuments).mockReturnValue(query(0) as never);
    expect((await update()).status).toBe(409);
    expect(target.save).not.toHaveBeenCalled();
  });
  it("preserves unrelated memberships during a permission-only change", async () => {
    target.role = "ORGANIZATION_ADMIN";
    const org = {
      _id: new mongoose.Types.ObjectId(),
      publicId: organizationId,
      status: "APPROVED",
    };
    vi.mocked(Organization.findOne).mockReturnValue(query(org) as never);
    vi.mocked(Membership.find).mockReturnValue(
      query([
        { organizationId: org._id, role: "ORGANIZATION_ADMIN" },
        {
          organizationId: new mongoose.Types.ObjectId(),
          role: "ORGANIZATION_ADMIN",
        },
      ]) as never,
    );
    expect(
      (
        await update({
          role: "ORGANIZATION_ADMIN",
          organizationId,
          position: "PRESIDENT",
        })
      ).status,
    ).toBe(200);
    expect(Membership.updateMany).not.toHaveBeenCalled();
  });
  it("enforces revoked permissions on real profile and Platform Admin endpoints", async () => {
    vi.mocked(User.findById).mockResolvedValue({
      ...actor,
      role: "PLATFORM_ADMIN",
      permissions: ["applications.read"],
    } as never);
    expect(
      (
        await request(app)
          .post(
            "/api/platform-admin/applications/f8048838-bb43-479a-81a3-a654d65f84f4/review",
          )
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-fixture")
          .send({ decision: "APPROVED", reason: "Review" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .patch("/api/auth/profile")
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-fixture")
          .send({ name: "Updated" })
      ).status,
    ).toBe(403);
    expect(
      (await request(app).get("/api/auth/me").set("Cookie", cookie)).status,
    ).toBe(200);
  });
  it("preserves suspended business status when editing grants", async () => {
    target.role = "FLORIST";
    vi.mocked(Business.findOne).mockReturnValue(
      query({ status: "SUSPENDED" }) as never,
    );
    expect(
      (
        await update({
          role: "FLORIST",
          business: { name: "Shop", contact: "Contact", location: "City" },
        })
      ).status,
    ).toBe(200);
    expect(Business.findOneAndUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ status: "SUSPENDED" }),
      }),
      expect.anything(),
    );
  });
});
