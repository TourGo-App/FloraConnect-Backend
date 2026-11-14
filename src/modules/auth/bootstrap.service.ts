import mongoose from 'mongoose';
import { connectDB } from '../../config/database.js';
import { AuditLog, User } from './auth.models.js';
import { email, hashPassword } from './auth.security.js';

/** Local maintenance operation only. Never expose through a public router. */
export async function bootstrapSuperAdmin(
  addressInput: unknown,
  password: string | undefined,
): Promise<'created' | 'existing'> {
  const address = email(addressInput);
  if (!password || password.length < 8 || password.length > 128) {
    throw new Error(
      'Supply a temporary bootstrap password (8–128 characters).',
    );
  }
  await connectDB();
  // Establish collections/indexes before the transaction, including unique email.
  await Promise.all([User.init(), AuditLog.init()]);
  return mongoose.connection.transaction(async (session) => {
    const existing = await User.findOne({ email: address }).session(session);
    if (existing) {
      if (existing.role !== 'SUPER_ADMIN') {
        throw new Error(
          'This email belongs to another role. No role or password was changed.',
        );
      }
      return 'existing' as const;
    }
    const passwordHash = await hashPassword(password);
    const [user] = await User.create(
      [
        {
          name: 'FloraConnect Super Admin',
          email: address,
          passwordHash,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          mustChangePassword: true,
          accountType: 'USER',
        },
      ],
      { session },
    );
    await AuditLog.create(
      [
        {
          actorId: user._id,
          action: 'CONTROLLED_SUPER_ADMIN_BOOTSTRAP',
          targetId: user._id,
          details:
            'Initial administrator created by local maintenance command; password rotation required.',
        },
      ],
      { session },
    );
    return 'created' as const;
  });
}
