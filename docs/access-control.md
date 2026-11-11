# Authentication and initial administration

This implementation follows the supplied v1.0 role policy for the initial administration features. The seven role identifiers are server-owned. Public registration offers USER, FLORIST, GROWER and ORGANIZATION_REPRESENTATIVE application paths, never staff or organization-admin roles. Every public registrant starts as USER with pending email verification. Business/organization applicants retain that standard role until approval. Organization positions are descriptive fields, not permissions.

## Running locally

Use Node 22, configure the ignored .env and run npm run dev. Both dev and start load .env when present. The frontend proxies /api to port 3001; production uses the frontend Vercel /api rewrite. Deploy backend and frontend together before testing production authentication. Custom origins must be explicitly listed in FRONTEND_ORIGINS. Never use wildcard origins with credentials.

The seed:super-admin command takes BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD from the local process environment. It creates an active, email-verified Super Admin with a salted password hash and mustChangePassword enabled. It never replaces an existing account's role or password. No public endpoint creates Super Admins. Temporary passwords must be replaced before administration. Existing Super Admin accounts cannot be suspended through the normal users screen.

## Implemented API

- POST /api/auth/register: validated personal account and optional pending business/organization application, in a MongoDB transaction.
- POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout: opaque 8-hour sessions, HttpOnly SameSite=Lax cookies (Secure on Vercel/production), hashed session tokens, server-side expiry/revocation and fresh user-role/status checks.
- POST /api/auth/password: validates the current password, sets a new 12?128-character password, clears the temporary-password flag and revokes all sessions transactionally.
- PATCH /api/auth/profile: only the authenticated account's name, phone and address; no client-supplied user ID or role accepted.
- POST /api/auth/verify-email and /resend-verification: single-use hashed verification tokens expire after 24 hours. Verification activates only pending-email accounts, never grants elevated roles.
- GET /api/admin/overview and /applications: Super Admin and Platform Admin only; paginated verification requests and actual database counts. Privileged audit activity is returned only to Super Admin.
- POST /api/admin/applications/:id/review: approve/reject with a reason. Approval requires active verified email and an eligible USER account. Approved organizations create an organization record and linked Organization Admin membership; approved businesses create an owned business profile and assign FLORIST/GROWER. Review, role/profile changes and audit entry are transactional. Repeated reviews are rejected.
- GET /api/admin/users; POST /users/:id/platform-admin; POST /users/:id/status: Super Admin only. Staff assignment is limited to eligible verified standard users/Platform Admins, with pending applications resolved first. Status changes cannot bypass email verification. Sessions are revoked and decisions audited.

Mutations require an allowlisted Origin, application/json, and for authenticated actions the session's X-CSRF-Token. Credentials and verification requests are throttled with MongoDB counters shared across instances. The UI is not an authorization boundary. No user-provided plan/evidence URL is fetched by the server.

## Email delivery integration

Configure VERIFICATION_EMAIL_WEBHOOK and VERIFICATION_EMAIL_WEBHOOK_TOKEN with your private HTTPS mail adapter. It receives {to, subject, text} and must deliver the email; it should return 2xx only after accepting delivery. FRONTEND_URL determines the verification link origin. Verification tokens are sent only to the adapter and retained as hashes in users; links put tokens in the URL fragment. No raw tokens/passwords are returned by registration or written to logs. Without an adapter, registration returns an explicit pending/delivery-unavailable message, users cannot log in until verified, and approval remains blocked. Email resend is available after mail configuration. No email provider was configured by this change.

## Deliberate boundaries

This is an initial admin dashboard, not implementation of all future modules in the specification. Seller listings/orders, organization member invitations and draft-post approval, report moderation, global settings, MFA, account recovery and full financial/operational policies still require their own APIs and tests. No fake statistics or bypasses are provided for these features. MFA should be added before public production administration. MongoDB transactions require a replica set (Atlas supports them); a single standalone Docker node must be configured as a replica set for registration/review transactions.

## Verification

Run npm run typecheck, npm test and npm run build. Auth tests mock storage and never modify shared Atlas records. Real browser smoke checks use only the explicitly requested seed account; they do not change its temporary password. Verify an actual email provider and multi-account business/organization review flow in staging before production use.
