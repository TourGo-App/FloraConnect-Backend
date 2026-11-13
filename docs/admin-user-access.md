# Super Admin user provisioning and access management

All routes below are under `/api/admin/console` and retain the existing authenticated,
active, verified `SUPER_ADMIN` gate, temporary-password restriction, trusted-origin
check, and CSRF protection for mutations. Platform Admins and ordinary accounts
cannot invoke these operations, including by sending elevated permission IDs.

## API contract

| Method and path | Behavior |
| --- | --- |
| `GET /access-policy` | Seven role definitions, scopes, available permission IDs and mandatory account capabilities |
| `POST /users` | Create an account and any required organization/business context atomically |
| `GET /users/:uuid/access` | Safe user fields, effective permissions, matching organization and business context |
| `PATCH /users/:uuid/access` | Assign a role and bounded grants, synchronize context, revoke sessions and record an audit |

Creation accepts `name`, `email`, optional `phone`, `temporaryPassword`, `role`,
`permissions`, `currentPassword` and `reason`. Organization roles additionally
require `organizationId` (an approved organization's UUID) and `position`.
Florist/Grower roles require `business: { name, contact, location }`.
Super Admin creation or elevation additionally requires `confirmSuperAdmin: true`.
Unknown fields, including client-selected activation/verification state, are rejected.

Access updates accept role, grants, relevant context, current password and reason;
they cannot edit the target's credentials or personal fields. Personal edits use
the existing separate endpoint. UUIDs remain separate from internal ObjectIds.

## Activation and credentials

New accounts are always pending email verification and require a first-login
password change. Temporary passwords use the existing 8–128 character policy
and salted password hashing. The creation response never returns passwords,
hashes, verification tokens or session credentials. The administrator must share
the chosen temporary password through an appropriate secure channel.

The existing verification-mail adapter sends the verification link after the
transaction commits. If delivery is unavailable, creation still returns the actual
pending account and explicitly reports `verificationSent: false`. The account
cannot sign in until email verification succeeds. The mail adapter and its existing
backend environment configuration must be operational for activation; no new
mail credentials or automatic verification bypass are introduced.

## Permission semantics

The implementation source of truth is
[`auth.permissions.ts`](../src/modules/auth/auth.permissions.ts). Each account has
one system role; grants may narrow that role's capabilities, never extend them.
`profile.read` and `password.change` are mandatory for active authenticated
accounts. Super Admin always retains all implemented permissions and cannot be
assigned a restricted subset.

The optional persisted `User.permissions` field contains explicit grants. Missing
or null values inherit role defaults, preserving existing users. No backfill is
needed for that field. Unknown/out-of-role grants are rejected at write time and
excluded again by effective-permission calculation at read/enforcement time.

Platform overview, application viewing/review, and own-profile edits enforce the
new grants server-side. Password change and own-session inspection remain available
through the existing authentication gate. Other platform administration stays
Super-Admin-only; permissions do not bypass role, ownership or account-status checks.
Unsupported organization/business CRUD, orders, settings, and other unimplemented
domains are not presented as configurable working permissions.

## Atomic changes and safeguards

- Creation, linked membership/business writes and the privileged audit entry share
  a MongoDB transaction. Existing transactional deployment requirements still apply.
- Access changes require rate-limited current-password verification and a reason.
- The internal `AdministrationLock` singleton is initialized automatically and
  written inside each access-management transaction. It serializes grants and
  demotions, with the actor checked again after locking, preventing concurrent
  administrators from demoting each other using stale authorization snapshots.
- Self-access changes are rejected; another Super Admin must manage the actor's
  access. The last active, verified, rotation-complete Super Admin cannot be demoted.
- Pending applications must be resolved before access changes. Last organization
  administrator memberships are protected during replacement.
- Permission-only updates preserve unrelated organization memberships. Replacing a
  role on a multi-membership account requires separate membership management instead
  of silently deleting affiliations.
- Changing away from a business role suspends its business. Keeping/assigning an
  existing business preserves that record's status rather than silently reapproving it.
- Role/grant changes revoke the target user's server sessions. Audit details contain
  the reason and safe before/after access values, never either password or hash.

## Verification and release

145 backend tests passed, including role/permission boundary checks, direct API
denials, activation state, reauthentication, duplicate accounts, safe serialization,
context linkage, session revocation, serialization-lock use and last-admin guards.
Transactions and mail delivery are mocked in these automated tests. Live replica-set
concurrency, real verification delivery and production account activation were not
performed against user data.

Deploy this backend before or with the companion frontend forms. Existing records
must have persistent public UUIDs as required by the earlier identifier rollout;
that existing migration requirement is unchanged. No live migration or hosting
configuration changes were performed by this development task.
