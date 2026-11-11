import { randomBytes } from 'node:crypto';
import { User } from './auth.models.js';
import { digest, HttpError } from './auth.security.js';

// The webhook is a private mail-delivery adapter, configured by the operator.
// No token or message body is logged or returned through public registration APIs.
export async function sendVerification(
  userId: unknown,
  address: string,
): Promise<boolean> {
  const endpoint = process.env.VERIFICATION_EMAIL_WEBHOOK;
  const key = process.env.VERIFICATION_EMAIL_WEBHOOK_TOKEN;
  if (!endpoint || !key) return false;
  const target = new URL(endpoint);
  if (target.protocol !== 'https:')
    throw new HttpError(503, 'Verification email delivery is unavailable.');
  const frontend = new URL(
    process.env.FRONTEND_URL ?? 'https://flora-connect-frontend.vercel.app',
  );
  const token = randomBytes(32).toString('hex');
  await User.updateOne(
    { _id: userId, emailVerified: false },
    {
      verificationTokenHash: digest(token),
      verificationExpiresAt: new Date(Date.now() + 86400000),
    },
  );
  const link = new URL('/verify-email', frontend);
  link.hash = `token=${token}`;
  const response = await fetch(target, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: address,
      subject: 'Verify your FloraConnect email',
      text: `Verify your email by opening this link within 24 hours: ${link.toString()}. If you did not request this, ignore this email.`,
    }),
    signal: AbortSignal.timeout(10000),
    redirect: 'error',
  });
  if (!response.ok)
    throw new HttpError(503, 'Verification email delivery is unavailable.');
  return true;
}
