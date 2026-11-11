import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import {
  Application,
  AuditLog,
  AuthThrottle,
  Business,
  Membership,
  Organization,
  Session,
  User,
} from '../../src/modules/auth/auth.models.js';
import {
  hashPassword,
  verifyPassword,
} from '../../src/modules/auth/auth.security.js';

vi.mock('../../src/config/database.js', () => ({
  connectDB: vi.fn().mockResolvedValue({}),
  isDbConnected: () => false,
}));
const origin = 'http://localhost:5173';
const cookie = 'floraconnect_session=' + 'a'.repeat(64);
const base = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Staff',
  email: 'staff@example.test',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  emailVerified: true,
  mustChangePassword: false,
  accountType: 'USER',
};
let hash: string;
beforeAll(async () => {
  hash = await hashPassword('test-only-password-12');
});
beforeEach(() => {
  vi.spyOn(AuthThrottle, 'findOneAndUpdate').mockResolvedValue({
    count: 1,
  } as never);
  vi.spyOn(Session, 'findOne').mockResolvedValue({
    _id: '507f1f77bcf86cd799439012',
    userId: base._id,
    csrfToken: 'csrf-test',
  } as never);
  vi.spyOn(User, 'findById').mockResolvedValue(base as never);
});
afterEach(() => vi.restoreAllMocks());

describe('Authentication and server-side role boundaries', () => {
  it('hashes passwords with a unique salt and verifies without plaintext storage', async () => {
    const another = await hashPassword('test-only-password-12');
    expect(hash).not.toBe(another);
    expect(hash).not.toContain('test-only-password');
    expect(await verifyPassword('test-only-password-12', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
    expect(await verifyPassword('anything', 'malformed')).toBe(false);
  });
  it.each(['/api/admin/overview', '/api/admin/users', '/api/auth/me'])(
    'rejects unauthenticated direct requests to %s',
    async (url) => {
      expect((await request(app).get(url)).status).toBe(401);
    },
  );
  it.each([
    'USER',
    'GROWER',
    'FLORIST',
    'ORGANIZATION_ADMIN',
    'ORGANIZATION_MEMBER',
  ])('blocks %s from administration even with a session', async (role) => {
    vi.mocked(User.findById).mockResolvedValue({ ...base, role } as never);
    expect(
      (await request(app).get('/api/admin/overview').set('Cookie', cookie))
        .status,
    ).toBe(403);
  });
  it('blocks suspended and unverified accounts', async () => {
    for (const changes of [{ status: 'SUSPENDED' }, { emailVerified: false }]) {
      vi.mocked(User.findById).mockResolvedValue({
        ...base,
        ...changes,
      } as never);
      expect(
        (await request(app).get('/api/admin/overview').set('Cookie', cookie))
          .status,
      ).toBe(403);
    }
  });
  it('requires replacing a temporary admin password before administration', async () => {
    vi.mocked(User.findById).mockResolvedValue({
      ...base,
      mustChangePassword: true,
    } as never);
    expect(
      (await request(app).get('/api/admin/overview').set('Cookie', cookie))
        .status,
    ).toBe(403);
  });
  it('rejects a missing or expired server session', async () => {
    vi.mocked(Session.findOne).mockResolvedValue(null);
    expect(
      (await request(app).get('/api/admin/overview').set('Cookie', cookie))
        .status,
    ).toBe(401);
  });
  it('prevents Platform Admins from reading users or assigning system staff', async () => {
    vi.mocked(User.findById).mockResolvedValue({
      ...base,
      role: 'PLATFORM_ADMIN',
    } as never);
    expect(
      (await request(app).get('/api/admin/users').set('Cookie', cookie)).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/admin/users/${base._id}/platform-admin`)
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-CSRF-Token', 'csrf-test')
          .send({ enabled: true, reason: 'test' })
      ).status,
    ).toBe(403);
  });
  it('requires trusted origins for credential requests', async () => {
    for (const source of ['', 'https://untrusted.example']) {
      const req = request(app).post('/api/auth/login');
      if (source) req.set('Origin', source);
      expect(
        (await req.send({ email: base.email, password: 'invalid' })).status,
      ).toBe(403);
    }
  });
  it('rejects protected mutations without the matching CSRF token', async () => {
    expect(
      (
        await request(app)
          .post('/api/auth/logout')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .send({})
      ).status,
    ).toBe(403);
  });
  it('does not allow public registration to assign privileges or verified status', async () => {
    const create = vi.spyOn(User, 'create');
    for (const override of [
      { role: 'SUPER_ADMIN' },
      { role: 'PLATFORM_ADMIN' },
      { emailVerified: true },
      { status: 'ACTIVE' },
    ]) {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Origin', origin)
        .send({
          name: 'Test',
          email: 'test@example.test',
          password: 'long-enough-password',
          ...override,
        });
      expect(response.status).toBe(400);
    }
    expect(create).not.toHaveBeenCalled();
  });
  it('rejects administrator or membership registration paths and short passwords', async () => {
    for (const changes of [
      { accountType: 'SUPER_ADMIN' },
      { accountType: 'PLATFORM_ADMIN' },
      { accountType: 'ORGANIZATION_MEMBER' },
      { password: 'short' },
    ]) {
      expect(
        (
          await request(app)
            .post('/api/auth/register')
            .set('Origin', origin)
            .send({
              name: 'Test',
              email: 'test@example.test',
              password: 'long-enough-password',
              ...changes,
            })
        ).status,
      ).toBe(400);
    }
  });
  it('requires evidence and category details for organization applications', async () => {
    expect(
      (
        await request(app)
          .post('/api/auth/register')
          .set('Origin', origin)
          .send({
            name: 'Test',
            email: 'test@example.test',
            password: 'long-enough-password',
            accountType: 'ORGANIZATION_REPRESENTATIVE',
            application: {
              name: 'Test Org',
              location: 'Test',
              contact: 'Test',
              evidenceUrl: 'https://example.test',
              position: 'PRESIDENT',
            },
          })
      ).status,
    ).toBe(400);
  });
  it('login returns only safe account fields, a CSRF token and an HttpOnly cookie', async () => {
    vi.spyOn(User, 'findOne').mockReturnValue({
      select: () => Promise.resolve({ ...base, passwordHash: hash }),
    } as never);
    vi.spyOn(Session, 'create').mockResolvedValue({} as never);
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email: base.email, password: 'test-only-password-12' });
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('SUPER_ADMIN');
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.csrfToken).toMatch(/^[a-f0-9]{64}$/);
    expect(String(response.headers['set-cookie'])).toMatch(/HttpOnly/);
    expect(String(response.headers['set-cookie'])).toMatch(/SameSite=Lax/);
  });
  it('unknown users and wrong passwords receive the same generic failure', async () => {
    for (const user of [null, { ...base, passwordHash: hash }]) {
      vi.spyOn(User, 'findOne').mockReturnValue({
        select: () => Promise.resolve(user),
      } as never);
      const response = await request(app)
        .post('/api/auth/login')
        .set('Origin', origin)
        .send({ email: base.email, password: 'wrong-password' });
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Email or password is incorrect.');
    }
  });
  it('pending accounts cannot log in even with the correct password', async () => {
    vi.spyOn(User, 'findOne').mockReturnValue({
      select: () =>
        Promise.resolve({
          ...base,
          status: 'PENDING_EMAIL_VERIFICATION',
          emailVerified: false,
          passwordHash: hash,
        }),
    } as never);
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .set('Origin', origin)
          .send({ email: base.email, password: 'test-only-password-12' })
      ).status,
    ).toBe(403);
  });
  it('rate-limits credentials before attempting password validation', async () => {
    vi.mocked(AuthThrottle.findOneAndUpdate).mockResolvedValue({
      count: 21,
    } as never);
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .set('Origin', origin)
          .send({ email: base.email, password: 'anything' })
      ).status,
    ).toBe(429);
  });
  it('revokes server sessions when logging out', async () => {
    const remove = vi
      .spyOn(Session, 'deleteOne')
      .mockResolvedValue({ deletedCount: 1, acknowledged: true } as never);
    expect(
      (
        await request(app)
          .post('/api/auth/logout')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-CSRF-Token', 'csrf-test')
          .send({})
      ).status,
    ).toBe(204);
    expect(remove).toHaveBeenCalled();
  });
  it('edits only the authenticated profile and rejects role mass assignment', async () => {
    const edit = vi
      .spyOn(User, 'findByIdAndUpdate')
      .mockResolvedValue(base as never);
    const response = await request(app)
      .patch('/api/auth/profile')
      .set('Cookie', cookie)
      .set('Origin', origin)
      .set('X-CSRF-Token', 'csrf-test')
      .send({ name: 'New Name' });
    expect(response.status).toBe(200);
    expect(edit.mock.calls[0][0]).toBe(base._id);
    expect(
      (
        await request(app)
          .patch('/api/auth/profile')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-CSRF-Token', 'csrf-test')
          .send({ name: 'New', role: 'SUPER_ADMIN' })
      ).status,
    ).toBe(400);
  });
  it('Platform Admin overview excludes the privileged audit trail', async () => {
    vi.mocked(User.findById).mockResolvedValue({
      ...base,
      role: 'PLATFORM_ADMIN',
    } as never);
    vi.spyOn(User, 'countDocuments').mockResolvedValue(2);
    vi.spyOn(Organization, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(Business, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(Application, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(AuditLog, 'find').mockReturnValue({
      sort: () => ({
        limit: () => ({
          select: () => ({ lean: async () => [{ action: 'PRIVATE' }] }),
        }),
      }),
    } as never);
    const response = await request(app)
      .get('/api/admin/overview')
      .set('Cookie', cookie);
    expect(response.status).toBe(200);
    expect(response.body.audit).toEqual([]);
    expect(response.body.counts.pending).toBe(1);
  });
});

describe('Transactional application review', () => {
  const applicantId = '507f1f77bcf86cd799439022';
  const applicationId = '507f1f77bcf86cd799439023';
  const organizationId = '507f1f77bcf86cd799439024';
  function fixture(verified = true) {
    const applicant = {
      ...base,
      _id: applicantId,
      role: 'USER',
      emailVerified: verified,
      save: vi.fn().mockResolvedValue({}),
    };
    const application = {
      _id: applicationId,
      userId: applicantId,
      type: 'ORGANIZATION_REPRESENTATIVE',
      organizationType: 'HORTICULTURAL_SOCIETY',
      position: 'PRESIDENT',
      name: 'Test Society',
      contact: 'test@example.test',
      location: 'Test location',
      status: 'PENDING',
      save: vi.fn().mockResolvedValue({}),
    };
    vi.spyOn(mongoose.connection, 'transaction').mockImplementation((async (
      callback: (session: mongoose.ClientSession) => Promise<unknown>,
    ) => callback({} as mongoose.ClientSession)) as never);
    vi.mocked(User.findById).mockImplementation((id: unknown) => {
      const doc = String(id) === applicantId ? applicant : base;
      return Object.assign(Promise.resolve(doc), {
        session: async () => doc,
      }) as never;
    });
    vi.spyOn(Application, 'findOne').mockReturnValue({
      session: async () => application,
    } as never);
    vi.spyOn(Organization, 'create').mockResolvedValue([
      { _id: organizationId },
    ] as never);
    vi.spyOn(Membership, 'create').mockResolvedValue([] as never);
    vi.spyOn(AuditLog, 'create').mockResolvedValue([] as never);
    return { applicant, application };
  }
  const review = (decision = 'APPROVED') =>
    request(app)
      .post(`/api/admin/applications/${applicationId}/review`)
      .set('Cookie', cookie)
      .set('Origin', origin)
      .set('X-CSRF-Token', 'csrf-test')
      .send({ decision, reason: 'Reviewed supporting evidence.' });
  it('cannot approve an unverified applicant or derive admin access from a title', async () => {
    const f = fixture(false);
    expect((await review()).status).toBe(409);
    expect(f.applicant.role).toBe('USER');
    expect(Organization.create).not.toHaveBeenCalled();
    expect(Membership.create).not.toHaveBeenCalled();
  });
  it('links approval to a specific organization and records a privileged audit entry', async () => {
    const f = fixture();
    expect((await review()).status).toBe(200);
    expect(f.applicant.role).toBe('ORGANIZATION_ADMIN');
    expect(Membership.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          userId: applicantId,
          organizationId,
          role: 'ORGANIZATION_ADMIN',
          status: 'ACTIVE',
        }),
      ],
      expect.anything(),
    );
    expect(AuditLog.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          actorId: base._id,
          targetId: applicationId,
          action: 'APPLICATION_APPROVED',
        }),
      ],
      expect.anything(),
    );
  });
  it('rejects without granting permissions or creating an organization', async () => {
    const f = fixture(false);
    expect((await review('REJECTED')).status).toBe(200);
    expect(f.applicant.role).toBe('USER');
    expect(Organization.create).not.toHaveBeenCalled();
    expect(f.application.status).toBe('REJECTED');
  });
  it('refuses reviews already decided by another administrator', async () => {
    fixture();
    vi.mocked(Application.findOne).mockReturnValue({
      session: async () => null,
    } as never);
    expect((await review()).status).toBe(409);
    expect(Organization.create).not.toHaveBeenCalled();
  });
});

describe('Credential rotation and email verification', () => {
  it('changes only the authenticated account password and revokes every session', async () => {
    const actor = { ...base, passwordHash: hash };
    vi.mocked(User.findById).mockReturnValue(
      Object.assign(Promise.resolve(actor), {
        select: async () => actor,
      }) as never,
    );
    vi.spyOn(mongoose.connection, 'transaction').mockImplementation((async (
      callback: (session: mongoose.ClientSession) => Promise<unknown>,
    ) => callback({} as mongoose.ClientSession)) as never);
    const update = vi
      .spyOn(User, 'updateOne')
      .mockResolvedValue({ acknowledged: true } as never);
    const revoke = vi
      .spyOn(Session, 'deleteMany')
      .mockResolvedValue({ acknowledged: true } as never);
    vi.spyOn(AuditLog, 'create').mockResolvedValue([] as never);
    const response = await request(app)
      .post('/api/auth/password')
      .set('Cookie', cookie)
      .set('Origin', origin)
      .set('X-CSRF-Token', 'csrf-test')
      .send({
        currentPassword: 'test-only-password-12',
        newPassword: 'replacement-password-12',
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
  it('does not rotate a password without knowing the current one', async () => {
    const actor = { ...base, passwordHash: hash };
    vi.mocked(User.findById).mockReturnValue(
      Object.assign(Promise.resolve(actor), {
        select: async () => actor,
      }) as never,
    );
    const update = vi.spyOn(User, 'updateOne');
    expect(
      (
        await request(app)
          .post('/api/auth/password')
          .set('Cookie', cookie)
          .set('Origin', origin)
          .set('X-CSRF-Token', 'csrf-test')
          .send({
            currentPassword: 'wrong-password',
            newPassword: 'replacement-password-12',
          })
      ).status,
    ).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });
  it('accepts only unused, unexpired verification hashes for pending accounts, without role assignment', async () => {
    const update = vi
      .spyOn(User, 'findOneAndUpdate')
      .mockResolvedValue(base as never);
    const response = await request(app)
      .post('/api/auth/verify-email')
      .set('Origin', origin)
      .send({ token: 'b'.repeat(64) });
    expect(response.status).toBe(200);
    const [filter, changes] = update.mock.calls[0];
    expect(filter).toMatchObject({
      emailVerified: false,
      status: 'PENDING_EMAIL_VERIFICATION',
      verificationExpiresAt: { $gt: expect.any(Date) },
    });
    expect(changes).toMatchObject({
      $set: { status: 'ACTIVE', emailVerified: true },
    });
    expect(JSON.stringify(changes)).not.toContain('role');
    expect(
      String(
        (filter as unknown as Record<string, unknown>).verificationTokenHash,
      ),
    ).not.toBe('b'.repeat(64));
  });
  it('rejects expired or reused email-verification tokens', async () => {
    vi.spyOn(User, 'findOneAndUpdate').mockResolvedValue(null);
    expect(
      (
        await request(app)
          .post('/api/auth/verify-email')
          .set('Origin', origin)
          .send({ token: 'b'.repeat(64) })
      ).status,
    ).toBe(400);
  });
});
