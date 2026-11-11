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
  Application,
  AuditLog,
  AuthThrottle,
  Business,
  Membership,
  Organization,
  Session,
  User,
} from "../../src/modules/auth/auth.models.js";
import {
  hashPassword,
  verifyPassword,
} from "../../src/modules/auth/auth.security.js";

vi.mock("../../src/config/database.js", () => ({
  connectDB: vi.fn().mockResolvedValue({}),
  isDbConnected: () => false,
}));
const origin = "http://localhost:5173";
const cookie = "floraconnect_session=" + "a".repeat(64);
const base = {
  _id: "507f1f77bcf86cd799439011",
  publicId: "78ed06ba-8a40-4425-a430-a7d297f4a21c",
  name: "Staff",
  email: "staff@example.test",
  role: "SUPER_ADMIN",
  status: "ACTIVE",
  emailVerified: true,
  mustChangePassword: false,
  accountType: "USER",
};
let hash: string;
beforeAll(async () => {
  hash = await hashPassword("test-only-password-12");
});
beforeEach(() => {
  vi.spyOn(AuthThrottle, "findOneAndUpdate").mockResolvedValue({
    count: 1,
  } as never);
  vi.spyOn(Session, "findOne").mockResolvedValue({
    _id: "507f1f77bcf86cd799439012",
    userId: base._id,
    csrfToken: "csrf-test",
  } as never);
  vi.spyOn(User, "findById").mockResolvedValue(base as never);
});
afterEach(() => vi.restoreAllMocks());

describe("Authentication and server-side role boundaries", () => {
  it("hashes passwords with a unique salt and verifies without plaintext storage", async () => {
    const another = await hashPassword("test-only-password-12");
    expect(hash).not.toBe(another);
    expect(hash).not.toContain("test-only-password");
    expect(await verifyPassword("test-only-password-12", hash)).toBe(true);
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
    expect(await verifyPassword("anything", "malformed")).toBe(false);
  });
  it.each(["/api/admin/overview", "/api/admin/users", "/api/auth/me"])(
    "rejects unauthenticated direct requests to %s",
    async (url) => {
      expect((await request(app).get(url)).status).toBe(401);
    },
  );
  it.each([
    "USER",
    "GROWER",
    "FLORIST",
    "ORGANIZATION_ADMIN",
    "ORGANIZATION_MEMBER",
  ])("blocks %s from administration even with a session", async (role) => {
    vi.mocked(User.findById).mockResolvedValue({ ...base, role } as never);
    expect(
      (await request(app).get("/api/admin/overview").set("Cookie", cookie))
        .status,
    ).toBe(403);
  });
  it("blocks suspended and unverified accounts", async () => {
    for (const changes of [{ status: "SUSPENDED" }, { emailVerified: false }]) {
      vi.mocked(User.findById).mockResolvedValue({
        ...base,
        ...changes,
      } as never);
      expect(
        (await request(app).get("/api/admin/overview").set("Cookie", cookie))
          .status,
      ).toBe(403);
    }
  });
  it("requires replacing a temporary admin password before administration", async () => {
    vi.mocked(User.findById).mockResolvedValue({
      ...base,
      mustChangePassword: true,
    } as never);
    expect(
      (await request(app).get("/api/admin/overview").set("Cookie", cookie))
        .status,
    ).toBe(403);
  });
  it("rejects a missing or expired server session", async () => {
    vi.mocked(Session.findOne).mockResolvedValue(null);
    expect(
      (await request(app).get("/api/admin/overview").set("Cookie", cookie))
        .status,
    ).toBe(401);
  });
  it("prevents Platform Admins from reading users or assigning system staff", async () => {
    vi.mocked(User.findById).mockResolvedValue({
      ...base,
      role: "PLATFORM_ADMIN",
    } as never);
    expect(
      (await request(app).get("/api/admin/users").set("Cookie", cookie)).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/admin/users/${base._id}/platform-admin`)
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-test")
          .send({ enabled: true, reason: "test" })
      ).status,
    ).toBe(403);
  });
  it.each([
    "PLATFORM_ADMIN",
    "USER",
    "FLORIST",
    "GROWER",
    "ORGANIZATION_ADMIN",
    "ORGANIZATION_MEMBER",
  ])("denies every Super Admin API to %s", async (role) => {
    vi.mocked(User.findById).mockResolvedValue({ ...base, role } as never);
    for (const url of [
      "/api/admin/overview",
      "/api/admin/applications",
      "/api/admin/console/summary",
      "/api/admin/console/roles",
      "/api/admin/console/analytics",
    ]) {
      expect((await request(app).get(url).set("Cookie", cookie)).status).toBe(
        403,
      );
    }
    expect(
      (
        await request(app)
          .post("/api/admin/console/records/users/query")
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-test")
          .send({})
      ).status,
    ).toBe(403);
  });
  it("rejects database IDs in resource URLs before a mutation is attempted", async () => {
    const lookup = vi.spyOn(User, "findOne");
    const response = await request(app)
      .post(`/api/admin/users/${base._id}/status`)
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({ status: "SUSPENDED", reason: "Review" });
    expect(response.status).toBe(400);
    expect(lookup).not.toHaveBeenCalled();
  });
  it("keeps query endpoints protected by CSRF even though they only read", async () => {
    expect(
      (
        await request(app)
          .post("/api/admin/console/records/users/query")
          .set("Cookie", cookie)
          .set("Origin", origin)
          .send({ search: "user@example.test" })
      ).status,
    ).toBe(403);
  });
  it("paginates administrative queries and returns public identifiers only", async () => {
    const limit = vi.fn().mockReturnValue({ lean: async () => [base] });
    const skip = vi.fn().mockReturnValue({ limit });
    const sort = vi.fn().mockReturnValue({ skip });
    const find = vi.spyOn(User, "find").mockReturnValue({ sort } as never);
    vi.spyOn(User, "countDocuments").mockResolvedValue(21);
    const response = await request(app)
      .post("/api/admin/console/records/users/query")
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({ page: 2, search: "staff@example.test" });
    expect(response.status).toBe(200);
    expect(skip).toHaveBeenCalledWith(20);
    expect(limit).toHaveBeenCalledWith(20);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ $or: expect.any(Array) }),
    );
    expect(response.body.records[0].id).toBe(base.publicId);
    expect(JSON.stringify(response.body)).not.toContain(base._id);
    expect(response.body.total).toBe(21);
  });
  it("does not accept MongoDB filter operators as search or resource input", async () => {
    const response = await request(app)
      .post("/api/admin/console/records/__proto__/query")
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({ search: { $ne: null } });
    expect(response.status).toBe(404);
  });
  it("requires trusted origins for credential requests", async () => {
    for (const source of ["", "https://untrusted.example"]) {
      const req = request(app).post("/api/auth/login");
      if (source) req.set("Origin", source);
      expect(
        (await req.send({ email: base.email, password: "invalid" })).status,
      ).toBe(403);
    }
  });
  it("rejects protected mutations without the matching CSRF token", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/logout")
          .set("Cookie", cookie)
          .set("Origin", origin)
          .send({})
      ).status,
    ).toBe(403);
  });
  it("does not allow public registration to assign privileges or verified status", async () => {
    const create = vi.spyOn(User, "create");
    for (const override of [
      { role: "SUPER_ADMIN" },
      { role: "PLATFORM_ADMIN" },
      { emailVerified: true },
      { status: "ACTIVE" },
    ]) {
      const response = await request(app)
        .post("/api/auth/register")
        .set("Origin", origin)
        .send({
          name: "Test",
          email: "test@example.test",
          password: "long-enough-password",
          ...override,
        });
      expect(response.status).toBe(400);
    }
    expect(create).not.toHaveBeenCalled();
  });
  it("rejects administrator or membership registration paths and short passwords", async () => {
    for (const changes of [
      { accountType: "SUPER_ADMIN" },
      { accountType: "PLATFORM_ADMIN" },
      { accountType: "ORGANIZATION_MEMBER" },
      { password: "short" },
    ]) {
      expect(
        (
          await request(app)
            .post("/api/auth/register")
            .set("Origin", origin)
            .send({
              name: "Test",
              email: "test@example.test",
              password: "long-enough-password",
              ...changes,
            })
        ).status,
      ).toBe(400);
    }
  });
  it("requires evidence and category details for organization applications", async () => {
    expect(
      (
        await request(app)
          .post("/api/auth/register")
          .set("Origin", origin)
          .send({
            name: "Test",
            email: "test@example.test",
            password: "long-enough-password",
            registrationKind: "organization",
            application: {
              name: "Test Org",
              location: "Test",
              contact: "Test",
              evidenceUrl: "https://example.test",
              position: "PRESIDENT",
            },
          })
      ).status,
    ).toBe(400);
  });
  it("login returns only safe account fields, a CSRF token and an HttpOnly cookie", async () => {
    vi.spyOn(User, "findOne").mockReturnValue({
      select: () => Promise.resolve({ ...base, passwordHash: hash }),
    } as never);
    vi.spyOn(Session, "create").mockResolvedValue({} as never);
    const response = await request(app)
      .post("/api/auth/login")
      .set("Origin", origin)
      .send({ email: base.email, password: "test-only-password-12" });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe("SUPER_ADMIN");
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(String(response.headers["set-cookie"])).toMatch(/HttpOnly/);
    expect(String(response.headers["set-cookie"])).toMatch(/SameSite=Lax/);
  });
  it("unknown users and wrong passwords receive the same generic failure", async () => {
    for (const user of [null, { ...base, passwordHash: hash }]) {
      vi.spyOn(User, "findOne").mockReturnValue({
        select: () => Promise.resolve(user),
      } as never);
      const response = await request(app)
        .post("/api/auth/login")
        .set("Origin", origin)
        .send({ email: base.email, password: "wrong-password" });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Email or password is incorrect.");
    }
  });
  it("pending accounts cannot log in even with the correct password", async () => {
    vi.spyOn(User, "findOne").mockReturnValue({
      select: () =>
        Promise.resolve({
          ...base,
          status: "PENDING_EMAIL_VERIFICATION",
          emailVerified: false,
          passwordHash: hash,
        }),
    } as never);
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", origin)
          .send({ email: base.email, password: "test-only-password-12" })
      ).status,
    ).toBe(403);
  });
  it("rate-limits credentials before attempting password validation", async () => {
    vi.mocked(AuthThrottle.findOneAndUpdate).mockResolvedValue({
      count: 21,
    } as never);
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .set("Origin", origin)
          .send({ email: base.email, password: "anything" })
      ).status,
    ).toBe(429);
  });
  it("revokes server sessions when logging out", async () => {
    const remove = vi
      .spyOn(Session, "deleteOne")
      .mockResolvedValue({ deletedCount: 1, acknowledged: true } as never);
    expect(
      (
        await request(app)
          .post("/api/auth/logout")
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-test")
          .send({})
      ).status,
    ).toBe(204);
    expect(remove).toHaveBeenCalled();
  });
  it("edits only the authenticated profile and rejects role mass assignment", async () => {
    const edit = vi
      .spyOn(User, "findByIdAndUpdate")
      .mockResolvedValue(base as never);
    const response = await request(app)
      .patch("/api/auth/profile")
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({ name: "New Name" });
    expect(response.status).toBe(200);
    expect(edit.mock.calls[0][0]).toBe(base._id);
    expect(
      (
        await request(app)
          .patch("/api/auth/profile")
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-test")
          .send({ name: "New", role: "SUPER_ADMIN" })
      ).status,
    ).toBe(400);
  });
  it("Platform Admin overview excludes the privileged audit trail", async () => {
    vi.mocked(User.findById).mockResolvedValue({
      ...base,
      role: "PLATFORM_ADMIN",
    } as never);
    vi.spyOn(User, "countDocuments").mockResolvedValue(2);
    vi.spyOn(Organization, "countDocuments").mockResolvedValue(0);
    vi.spyOn(Business, "countDocuments").mockResolvedValue(0);
    vi.spyOn(Application, "countDocuments").mockResolvedValue(1);
    vi.spyOn(AuditLog, "find").mockReturnValue({
      sort: () => ({
        limit: () => ({
          select: () => ({ lean: async () => [{ action: "PRIVATE" }] }),
        }),
      }),
    } as never);
    const response = await request(app)
      .get("/api/platform-admin/overview")
      .set("Cookie", cookie);
    expect(response.status).toBe(200);
    expect(response.body.audit).toEqual([]);
    expect(response.body.counts.pending).toBe(1);
  });
});

describe("Public registration intent and privilege injection", () => {
  const input = {
    name: "Applicant",
    email: "applicant@example.test",
    password: "test-only-password-12",
    registrationKind: "personal",
  };
  const register = (body: object) =>
    request(app).post("/api/auth/register").set("Origin", origin).send(body);
  it.each([
    "role",
    "roles",
    "permissions",
    "accountType",
    "publicId",
    "_id",
    "passwordHash",
    "isAdmin",
    "mustChangePassword",
    "emailVerified",
    "status",
  ])("rejects injected %s before account creation", async (field) => {
    const create = vi.spyOn(User, "create");
    expect((await register({ ...input, [field]: "SUPER_ADMIN" })).status).toBe(
      400,
    );
    expect(create).not.toHaveBeenCalled();
  });
  it.each([
    "SUPER_ADMIN",
    "PLATFORM_ADMIN",
    "ORGANIZATION_ADMIN",
    "ORGANIZATION_MEMBER",
    { $ne: null },
  ])(
    "rejects privileged or malformed registration intent %s",
    async (registrationKind) => {
      const create = vi.spyOn(User, "create");
      expect((await register({ ...input, registrationKind })).status).toBe(400);
      expect(create).not.toHaveBeenCalled();
    },
  );
  it("rejects privileges embedded inside an application", async () => {
    expect(
      (
        await register({
          ...input,
          registrationKind: "florist",
          application: {
            name: "Shop",
            contact: "Contact",
            location: "Location",
            evidenceUrl: "https://evidence.example.test",
            role: "SUPER_ADMIN",
          },
        })
      ).status,
    ).toBe(400);
  });
  it.each(["personal", "florist", "grower", "organization"])(
    "creates %s applicants only as unverified standard users",
    async (registrationKind) => {
      vi.spyOn(mongoose.connection, "transaction").mockImplementation((async (
        callback: (session: mongoose.ClientSession) => Promise<unknown>,
      ) => callback({} as mongoose.ClientSession)) as never);
      const create = vi
        .spyOn(User, "create")
        .mockResolvedValue([{ _id: base._id }] as never);
      const applicationCreate = vi
        .spyOn(Application, "create")
        .mockResolvedValue([] as never);
      const response = await register({
        ...input,
        registrationKind,
        ...(registrationKind === "personal"
          ? {}
          : {
              application: {
                name: "Shop",
                contact: "Contact",
                location: "Location",
                evidenceUrl: "https://evidence.example.test",
                ...(registrationKind === "organization"
                  ? {
                      organizationType: "HORTICULTURAL_SOCIETY",
                      position: "PRESIDENT",
                    }
                  : {}),
              },
            }),
      });
      expect(response.status).toBe(201);
      expect(create).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            role: "USER",
            status: "PENDING_EMAIL_VERIFICATION",
          }),
        ],
        expect.anything(),
      );
      if (registrationKind === "personal")
        expect(applicationCreate).not.toHaveBeenCalled();
      else expect(applicationCreate).toHaveBeenCalled();
      expect(response.body).not.toHaveProperty("passwordHash");
    },
  );
  it("requires a current password before staff privilege changes", async () => {
    const transaction = vi.spyOn(mongoose.connection, "transaction");
    const response = await request(app)
      .post(`/api/admin/users/${base.publicId}/platform-admin`)
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({ enabled: true, reason: "Review" });
    expect(response.status).toBe(400);
    expect(transaction).not.toHaveBeenCalled();
  });
  it("records a reauthenticated staff assignment without logging the password", async () => {
    const actor = { ...base, passwordHash: hash };
    vi.mocked(User.findById).mockReturnValue(
      Object.assign(Promise.resolve(actor), {
        select: async () => actor,
      }) as never,
    );
    vi.spyOn(mongoose.connection, "transaction").mockImplementation((async (
      callback: (session: mongoose.ClientSession) => Promise<unknown>,
    ) => callback({} as mongoose.ClientSession)) as never);
    const target = {
      ...base,
      role: "USER",
      save: vi.fn().mockResolvedValue({}),
    };
    vi.spyOn(User, "findOne").mockReturnValue({
      session: async () => target,
    } as never);
    vi.spyOn(Application, "exists").mockReturnValue({
      session: async () => null,
    } as never);
    const revoke = vi
      .spyOn(Session, "deleteMany")
      .mockResolvedValue({ acknowledged: true } as never);
    const audit = vi.spyOn(AuditLog, "create").mockResolvedValue([] as never);
    const response = await request(app)
      .post(`/api/admin/users/${base.publicId}/platform-admin`)
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({
        enabled: true,
        reason: "Approved staff assignment",
        currentPassword: "test-only-password-12",
      });
    expect(response.status).toBe(200);
    expect(target.role).toBe("PLATFORM_ADMIN");
    expect(revoke).toHaveBeenCalled();
    expect(JSON.stringify(audit.mock.calls)).not.toContain(
      "test-only-password-12",
    );
    expect(JSON.stringify(audit.mock.calls)).not.toContain(hash);
  });
  it("rejects an incorrect current password before staff mutation", async () => {
    const actor = { ...base, passwordHash: hash };
    vi.mocked(User.findById).mockReturnValue(
      Object.assign(Promise.resolve(actor), {
        select: async () => actor,
      }) as never,
    );
    const transaction = vi.spyOn(mongoose.connection, "transaction");
    expect(
      (
        await request(app)
          .post(`/api/admin/users/${base.publicId}/platform-admin`)
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-test")
          .send({
            enabled: true,
            reason: "Review",
            currentPassword: "wrong-password",
          })
      ).status,
    ).toBe(401);
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe("Transactional application review", () => {
  const applicantId = "507f1f77bcf86cd799439022";
  const applicationId = "507f1f77bcf86cd799439023";
  const applicationPublicId = "f8048838-bb43-479a-81a3-a654d65f84f4";
  const organizationId = "507f1f77bcf86cd799439024";
  function fixture(verified = true) {
    const applicant = {
      ...base,
      _id: applicantId,
      role: "USER",
      emailVerified: verified,
      save: vi.fn().mockResolvedValue({}),
    };
    const application = {
      _id: applicationId,
      userId: applicantId,
      type: "ORGANIZATION_REPRESENTATIVE",
      organizationType: "HORTICULTURAL_SOCIETY",
      position: "PRESIDENT",
      name: "Test Society",
      contact: "test@example.test",
      location: "Test location",
      status: "PENDING",
      save: vi.fn().mockResolvedValue({}),
    };
    vi.spyOn(mongoose.connection, "transaction").mockImplementation((async (
      callback: (session: mongoose.ClientSession) => Promise<unknown>,
    ) => callback({} as mongoose.ClientSession)) as never);
    vi.mocked(User.findById).mockImplementation((id: unknown) => {
      const doc = String(id) === applicantId ? applicant : base;
      return Object.assign(Promise.resolve(doc), {
        session: async () => doc,
      }) as never;
    });
    vi.spyOn(Application, "findOne").mockReturnValue({
      session: async () => application,
    } as never);
    vi.spyOn(Organization, "create").mockResolvedValue([
      { _id: organizationId },
    ] as never);
    vi.spyOn(Membership, "create").mockResolvedValue([] as never);
    vi.spyOn(AuditLog, "create").mockResolvedValue([] as never);
    return { applicant, application };
  }
  const review = (decision = "APPROVED") =>
    request(app)
      .post(`/api/admin/applications/${applicationPublicId}/review`)
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({ decision, reason: "Reviewed supporting evidence." });
  it("cannot approve an unverified applicant or derive admin access from a title", async () => {
    const f = fixture(false);
    expect((await review()).status).toBe(409);
    expect(f.applicant.role).toBe("USER");
    expect(Organization.create).not.toHaveBeenCalled();
    expect(Membership.create).not.toHaveBeenCalled();
  });
  it("links approval to a specific organization and records a privileged audit entry", async () => {
    const f = fixture();
    expect((await review()).status).toBe(200);
    expect(f.applicant.role).toBe("ORGANIZATION_ADMIN");
    expect(Membership.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          userId: applicantId,
          organizationId,
          role: "ORGANIZATION_ADMIN",
          status: "ACTIVE",
        }),
      ],
      expect.anything(),
    );
    expect(AuditLog.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          actorId: base._id,
          targetId: applicationId,
          action: "APPLICATION_APPROVED",
        }),
      ],
      expect.anything(),
    );
  });
  it("rejects without granting permissions or creating an organization", async () => {
    const f = fixture(false);
    expect((await review("REJECTED")).status).toBe(200);
    expect(f.applicant.role).toBe("USER");
    expect(Organization.create).not.toHaveBeenCalled();
    expect(f.application.status).toBe("REJECTED");
  });
  it("refuses reviews already decided by another administrator", async () => {
    fixture();
    vi.mocked(Application.findOne).mockReturnValue({
      session: async () => null,
    } as never);
    expect((await review()).status).toBe(409);
    expect(Organization.create).not.toHaveBeenCalled();
  });
});

describe("Credential rotation and email verification", () => {
  it("changes only the authenticated account password and revokes every session", async () => {
    const actor = { ...base, passwordHash: hash };
    vi.mocked(User.findById).mockReturnValue(
      Object.assign(Promise.resolve(actor), {
        select: async () => actor,
      }) as never,
    );
    vi.spyOn(mongoose.connection, "transaction").mockImplementation((async (
      callback: (session: mongoose.ClientSession) => Promise<unknown>,
    ) => callback({} as mongoose.ClientSession)) as never);
    const update = vi
      .spyOn(User, "updateOne")
      .mockResolvedValue({ acknowledged: true } as never);
    const revoke = vi
      .spyOn(Session, "deleteMany")
      .mockResolvedValue({ acknowledged: true } as never);
    vi.spyOn(AuditLog, "create").mockResolvedValue([] as never);
    const response = await request(app)
      .post("/api/auth/password")
      .set("Cookie", cookie)
      .set("Origin", origin)
      .set("X-CSRF-Token", "csrf-test")
      .send({
        currentPassword: "test-only-password-12",
        newPassword: "replacement-password-12",
      });
    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      { _id: base._id },
      expect.objectContaining({
        mustChangePassword: false,
        passwordHash: expect.stringMatching(/^scrypt:/),
      }),
      expect.anything(),
    );
    expect(revoke).toHaveBeenCalledWith(
      { userId: base._id },
      expect.anything(),
    );
  });
  it("does not rotate a password without knowing the current one", async () => {
    const actor = { ...base, passwordHash: hash };
    vi.mocked(User.findById).mockReturnValue(
      Object.assign(Promise.resolve(actor), {
        select: async () => actor,
      }) as never,
    );
    const update = vi.spyOn(User, "updateOne");
    expect(
      (
        await request(app)
          .post("/api/auth/password")
          .set("Cookie", cookie)
          .set("Origin", origin)
          .set("X-CSRF-Token", "csrf-test")
          .send({
            currentPassword: "wrong-password",
            newPassword: "replacement-password-12",
          })
      ).status,
    ).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });
  it("accepts only unused, unexpired verification hashes for pending accounts, without role assignment", async () => {
    const update = vi
      .spyOn(User, "findOneAndUpdate")
      .mockResolvedValue(base as never);
    const response = await request(app)
      .post("/api/auth/verify-email")
      .set("Origin", origin)
      .send({ token: "b".repeat(64) });
    expect(response.status).toBe(200);
    const [filter, changes] = update.mock.calls[0];
    expect(filter).toMatchObject({
      emailVerified: false,
      status: "PENDING_EMAIL_VERIFICATION",
      verificationExpiresAt: { $gt: expect.any(Date) },
    });
    expect(changes).toMatchObject({
      $set: { status: "ACTIVE", emailVerified: true },
    });
    expect(JSON.stringify(changes)).not.toContain("role");
    expect(
      String(
        (filter as unknown as Record<string, unknown>).verificationTokenHash,
      ),
    ).not.toBe("b".repeat(64));
  });
  it("rejects expired or reused email-verification tokens", async () => {
    vi.spyOn(User, "findOneAndUpdate").mockResolvedValue(null);
    expect(
      (
        await request(app)
          .post("/api/auth/verify-email")
          .set("Origin", origin)
          .send({ token: "b".repeat(64) })
      ).status,
    ).toBe(400);
  });
});
