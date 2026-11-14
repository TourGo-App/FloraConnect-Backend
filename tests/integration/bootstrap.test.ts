import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { AuditLog, User } from '../../src/modules/auth/auth.models.js';
import { bootstrapSuperAdmin } from '../../src/modules/auth/bootstrap.service.js';

vi.mock('../../src/config/database.js', () => ({
  connectDB: vi.fn().mockResolvedValue({}),
}));
const session = {} as mongoose.ClientSession;
beforeEach(() => {
  vi.spyOn(User, 'init').mockResolvedValue(User as never);
  vi.spyOn(AuditLog, 'init').mockResolvedValue(AuditLog as never);
  vi.spyOn(mongoose.connection, 'transaction').mockImplementation((async (
    callback: (session: mongoose.ClientSession) => Promise<unknown>,
  ) => callback(session)) as never);
  vi.spyOn(User, 'findOne').mockReturnValue({
    session: async () => null,
  } as never);
  vi.spyOn(User, 'create').mockResolvedValue([
    { _id: new mongoose.Types.ObjectId() },
  ] as never);
  vi.spyOn(AuditLog, 'create').mockResolvedValue([] as never);
});
afterEach(() => vi.restoreAllMocks());
describe('Controlled Super Admin bootstrap', () => {
  it('creates only a hashed, rotation-required account and matching audit in one transaction', async () => {
    expect(
      await bootstrapSuperAdmin(
        'Sample@Example.test',
        'temporary-test-password',
      ),
    ).toBe('created');
    expect(User.findOne).toHaveBeenCalledWith({ email: 'sample@example.test' });
    expect(User.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          role: 'SUPER_ADMIN',
          mustChangePassword: true,
          passwordHash: expect.stringMatching(/^scrypt:/),
        }),
      ],
      { session },
    );
    expect(JSON.stringify(vi.mocked(User.create).mock.calls)).not.toContain(
      'temporary-test-password',
    );
    expect(AuditLog.create).toHaveBeenCalledWith(
      [expect.objectContaining({ action: 'CONTROLLED_SUPER_ADMIN_BOOTSTRAP' })],
      { session },
    );
  });
  it('never replaces the password of an existing Super Admin', async () => {
    vi.mocked(User.findOne).mockReturnValue({
      session: async () => ({ role: 'SUPER_ADMIN' }),
    } as never);
    expect(
      await bootstrapSuperAdmin(
        'sample@example.test',
        'temporary-test-password',
      ),
    ).toBe('existing');
    expect(User.create).not.toHaveBeenCalled();
    expect(AuditLog.create).not.toHaveBeenCalled();
  });
  it('never elevates an existing normal account', async () => {
    vi.mocked(User.findOne).mockReturnValue({
      session: async () => ({ role: 'USER' }),
    } as never);
    await expect(
      bootstrapSuperAdmin('sample@example.test', 'temporary-test-password'),
    ).rejects.toThrow('another role');
    expect(User.create).not.toHaveBeenCalled();
  });
  it('rejects failed audit writes instead of reporting bootstrap success', async () => {
    vi.mocked(AuditLog.create).mockRejectedValue(new Error('write failure'));
    await expect(
      bootstrapSuperAdmin('sample@example.test', 'temporary-test-password'),
    ).rejects.toThrow('write failure');
    expect(mongoose.connection.transaction).toHaveBeenCalledOnce();
  });
  it('validates credentials before starting any database transaction', async () => {
    await expect(
      bootstrapSuperAdmin('not-an-email', 'temporary-test-password'),
    ).rejects.toThrow();
    await expect(
      bootstrapSuperAdmin('sample@example.test', 'short'),
    ).rejects.toThrow();
    expect(mongoose.connection.transaction).not.toHaveBeenCalled();
  });
});
