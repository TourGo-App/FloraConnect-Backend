import { connectDB, disconnectDB } from '../config/database.js';
import { AuditLog, User } from '../modules/auth/auth.models.js';
import { email, hashPassword } from '../modules/auth/auth.security.js';

async function main() {
  const address = email(process.env.BOOTSTRAP_ADMIN_EMAIL);
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!password || password.length < 8 || password.length > 128)
    throw new Error(
      'Supply BOOTSTRAP_ADMIN_PASSWORD (8–128 characters) in the local environment.',
    );
  await connectDB();
  await User.init();
  const existing = await User.findOne({ email: address });
  if (existing) {
    if (existing.role !== 'SUPER_ADMIN')
      throw new Error(
        'This email already belongs to a different role. No role or password was changed.',
      );
    console.log('Super Admin already exists. Password was not changed.');
    return;
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name: 'FloraConnect Super Admin',
    email: address,
    passwordHash,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
    mustChangePassword: true,
    accountType: 'USER',
  });
  await AuditLog.create({
    actorId: user._id,
    action: 'CONTROLLED_SUPER_ADMIN_BOOTSTRAP',
    targetId: user._id,
    details:
      'Initial administrator created by local maintenance command; password rotation required.',
  });
  console.log(
    'Super Admin created. Change the temporary password at first sign-in.',
  );
}
main()
  .catch(() => {
    console.error(
      'Super Admin setup failed. Check Atlas access, connectivity and bootstrap environment settings. No password is printed.',
    );
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
