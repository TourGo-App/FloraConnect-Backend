import { disconnectDB } from '../config/database.js';
import { bootstrapSuperAdmin } from '../modules/auth/bootstrap.service.js';

bootstrapSuperAdmin(
  process.env.BOOTSTRAP_ADMIN_EMAIL,
  process.env.BOOTSTRAP_ADMIN_PASSWORD,
)
  .then((result) => {
    console.log(
      result === 'existing'
        ? 'Super Admin already exists. Password was not changed.'
        : 'Super Admin created. Change the temporary password at first sign-in.',
    );
  })
  .catch(() => {
    console.error(
      'Super Admin setup failed. Check Atlas access, connectivity and bootstrap environment settings. No password is printed.',
    );
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
