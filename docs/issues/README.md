# FloraConnect Backend ? Development Issue Backlog

32 issue drafts based on FloraConnect project scope v1.0.

**[Open Backend GitHub Issues](https://github.com/TourGo-App/FloraConnect-Backend/issues)**

**Publication status:** These are local drafts, not published GitHub Issues. Planning IDs below are not GitHub issue numbers. Issue creation was blocked by the connected integration permissions.

Each task includes its scope, priority, relative size, dependencies, acceptance criteria and verification expectations. Request maintainer assignment before starting work. Existing foundation work is identified for validation rather than reimplementation.

## Issue index

| ID | Task | Phase | Priority | Size |
| --- | --- | --- | --- | --- |
| [INF-01](#inf-01) | Initialize Express + TypeScript API | 1 | P0 | S |
| [INF-03](#inf-03) | Configure PostgreSQL and Prisma | 1 | P0 | M |
| [INF-05](#inf-05) | API standards and OpenAPI specification | 1 | P0 | M |
| [INF-07](#inf-07) | Backend CI and automated test baseline | 1 | P0 | M |
| [INF-09](#inf-09) | Security middleware and logging | 1 | P0 | M |
| [INF-10](#inf-10) | Contributor setup and demo data | 1 | P0 | S |
| [AUTH-01](#auth-01) | User registration API | 2 | P0 | M |
| [AUTH-02](#auth-02) | Login, logout and session management | 2 | P0 | L |
| [AUTH-04](#auth-04) | Email verification and password recovery | 2 | P1 | L |
| [AUTH-05](#auth-05) | Role-based authorization | 2 | P0 | L |
| [ASC-01](#asc-01) | Association and chapter data models | 2 | P0 | M |
| [ASC-02](#asc-02) | Association directory and detail APIs | 2 | P0 | M |
| [ASC-04](#asc-04) | Membership application workflow | 2 | P0 | L |
| [FLW-01](#flw-01) | Flower categories and listing schema | 2 | P0 | M |
| [FLW-02](#flw-02) | Flower listing CRUD API | 2 | P0 | L |
| [FLW-03](#flw-03) | Secure image upload integration | 2 | P0 | M |
| [FLW-06](#flw-06) | Catalogue search, filters and pagination | 2 | P0 | M |
| [ANN-01](#ann-01) | Association announcement API | 2 | P0 | L |
| [ANN-03](#ann-03) | Official-source notice references | 2 | P1 | M |
| [EVT-01](#evt-01) | Events and exhibitions API | 3 | P1 | L |
| [EVT-03](#evt-03) | Event registration and capacity handling | 3 | P1 | L |
| [COM-01](#com-01) | Community posts and comments API | 3 | P1 | L |
| [COM-03](#com-03) | Community reporting and moderation | 3 | P1 | L |
| [NOT-01](#not-01) | In-app notification system | 3 | P1 | L |
| [NOT-03](#not-03) | Email notification preferences | 3 | P2 | M |
| [MKT-01](#mkt-01) | Buyer inquiry and seller response APIs | 4 | P1 | L |
| [MKT-03](#mkt-03) | Listing availability management | 4 | P1 | M |
| [ADM-01](#adm-01) | Platform moderation and audit logs | 4 | P1 | L |
| [ADM-03](#adm-03) | Aggregated analytics APIs | 4 | P2 | M |
| [QLT-02](#qlt-02) | Authorization and upload security regression | 5 | P1 | L |
| [QLT-04](#qlt-04) | API performance and database query optimization | 5 | P2 | L |
| [QLT-06](#qlt-06) | Advanced catalogue search | 5 | P2 | L |

P0 = MVP critical ? P1 = Important ? P2 = Enhancement. S/M/L are relative sizes, not delivery dates.

## Detailed issue drafts

<a id="inf-01"></a>

### [INF-01] Initialize Express + TypeScript API

#### Objective
Verify and document the existing API foundation rather than create a second application.

#### Planning metadata
- Planning ID: **INF-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **1**
- Priority: **P0** (MVP critical)
- Relative size: **S** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Implemented baseline — validation and contributor handoff remain**

#### Acceptance criteria
- [ ] Confirm Express 5, strict TypeScript and Node 22 build from a clean npm ci.
- [ ] Verify GET /api/health returns 200 with {status: 'ok', service: 'FloraConnect API'} locally and on Vercel without database credentials.
- [ ] Keep src/app.ts as the default-exported Vercel Express entry; use src/server.ts only for the local listener, avoiding a conflicting api/ function.
- [ ] Document local start, health checks and deployment troubleshooting.

#### Dependencies
- No feature dependency; start from the current repository baseline.

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="inf-03"></a>

### [INF-03] Configure PostgreSQL and Prisma

#### Objective
Establish reproducible Prisma migrations against PostgreSQL, with Neon deployment configuration.

#### Planning metadata
- Planning ID: **INF-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **1**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Add Prisma configuration/client with serverless-safe connection reuse and separate application/migration connection guidance.
- [ ] Create and commit an initial migration and an idempotent development seed foundation.
- [ ] Validate database environment settings without printing credentials; keep /api/health independent of database availability.
- [ ] Demonstrate migration deployment to a disposable database and document Neon setup, local alternatives and schema change commands.

#### Dependencies
- **INF-01** — Initialize Express + TypeScript API (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="inf-05"></a>

### [INF-05] API standards and OpenAPI specification

#### Objective
Define consistent REST contracts before feature modules expand.

#### Planning metadata
- Planning ID: **INF-05** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **1**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Document /api path conventions, HTTP statuses, pagination, timestamps and stable machine-readable errors.
- [ ] Publish a versioned OpenAPI specification and accessible API documentation including the current health endpoint.
- [ ] Define request validation conventions using Zod, safe error middleware and request IDs without leaking stack traces.
- [ ] Define authentication, ownership and association-scope responses (401/403/404) and provide reusable controller examples.

#### Dependencies
- **INF-01** — Initialize Express + TypeScript API (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="inf-07"></a>

### [INF-07] Backend CI and automated test baseline

#### Objective
Make pull requests run reproducible API checks.

#### Planning metadata
- Planning ID: **INF-07** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **1**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Local build and 8 health/CORS tests exist — CI remains**

#### Acceptance criteria
- [ ] Add GitHub Actions for PRs and main using the supported Node version, npm ci, typecheck, Vitest/Supertest and build.
- [ ] Preserve existing health/CORS tests; include deterministic environment setup and no production credentials.
- [ ] Separate database integration tests and document a disposable PostgreSQL service when needed.
- [ ] Make failures visible with useful reports and document checks maintainers should require before merge.

#### Dependencies
- **INF-01** — Initialize Express + TypeScript API (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="inf-09"></a>

### [INF-09] Security middleware and logging

#### Objective
Harden the Express boundary while preserving deployed frontend connectivity.

#### Planning metadata
- Planning ID: **INF-09** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **1**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Explicit CORS already exists — additional middleware/logging remain**

#### Acceptance criteria
- [ ] Preserve explicit CORS origins including production FE and local Vite; document configurable preview origins.
- [ ] Add suitable security headers, body size limits, request IDs and Pino structured logging with redaction.
- [ ] Define serverless-compatible rate limiting for auth/write operations; do not claim in-memory limits are global across Vercel instances.
- [ ] Test preflight, rejected browser origins, safe errors and redaction; document CSRF/session safeguards required for cookie-authenticated writes.

#### Dependencies
- **INF-01** — Initialize Express + TypeScript API (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="inf-10"></a>

### [INF-10] Contributor setup and demo data

#### Objective
Give new developers an independent and safe local setup.

#### Planning metadata
- Planning ID: **INF-10** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **1**
- Priority: **P0** (MVP critical)
- Relative size: **S** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Add CONTRIBUTING guidance for issue assignment, branches, linked PRs, review evidence and small changes.
- [ ] Document backend/frontend local integration, environment examples, migrations, seed and test commands.
- [ ] Seed deterministic synthetic associations, chapters and users after their schemas exist; never include real personal data or reusable production credentials.
- [ ] Verify onboarding from a clean checkout; retain the current TourGo ownership/license notices.

#### Dependencies
- **INF-03** — Configure PostgreSQL and Prisma (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).
- **INF-07** — Backend CI and automated test baseline (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="auth-01"></a>

### [AUTH-01] User registration API

#### Objective
Allow prospective growers and enthusiasts to create a member account.

#### Planning metadata
- Planning ID: **AUTH-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Implement Zod-validated registration with normalized unique email, display name and a documented password policy.
- [ ] Hash passwords using Argon2id and return a public user DTO that never includes the hash.
- [ ] Assign the least-privileged Registered Member role on the server; reject caller-supplied elevated roles.
- [ ] Test invalid input, duplicate/concurrent registration and secret redaction; document the endpoint in OpenAPI.

#### Dependencies
- **INF-03** — Configure PostgreSQL and Prisma (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).
- **INF-09** — Security middleware and logging (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="auth-02"></a>

### [AUTH-02] Login, logout and session management

#### Objective
Provide secure cookie-based login plus the protected profile API needed for MVP.

#### Planning metadata
- Planning ID: **AUTH-02** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Verify Argon2id passwords and issue short-lived JWT authentication in HTTP-only, secure production cookies with documented expiry/refresh/revocation behavior.
- [ ] Implement logout and invalid/expired/revoked session handling; protect cookie writes against CSRF and configure cross-site FE/BE CORS credentials correctly.
- [ ] Provide GET /api/users/me and validated PATCH /api/users/me for safe profile fields; forbid self-editing roles or privileged status.
- [ ] Test invalid credentials, session expiry/logout, unauthorized profile access and cross-origin cookie behavior; update OpenAPI.

#### Dependencies
- **AUTH-01** — User registration API (Backend).
- **INF-09** — Security middleware and logging (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="auth-04"></a>

### [AUTH-04] Email verification and password recovery

#### Objective
Allow account owners to verify email and recover access safely.

#### Planning metadata
- Planning ID: **AUTH-04** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Implement expiring single-use verification and password-reset tokens stored as hashes.
- [ ] Use non-enumerating request responses and rate limits; configure email delivery via environment settings without exposing secrets.
- [ ] Consume tokens atomically and invalidate relevant sessions after password reset; define resend and already-used behavior.
- [ ] Test expiry, reuse, invalid tokens, delivery failure and account enumeration; add OpenAPI and setup documentation.

#### Dependencies
- **AUTH-01** — User registration API (Backend).
- **AUTH-02** — Login, logout and session management (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="auth-05"></a>

### [AUTH-05] Role-based authorization

#### Objective
Enforce all five scoped roles on the server.

#### Planning metadata
- Planning ID: **AUTH-05** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Define permissions for Public Visitor, Registered Member, Association Administrator, Regional Coordinator and Platform Administrator.
- [ ] Implement reusable authentication/permission guards, resource ownership and association/chapter-scoped access checks.
- [ ] Never trust role, association scope or owner IDs from request bodies; use authoritative records.
- [ ] Add a permission matrix and negative tests covering cross-user, cross-association and cross-region access and role escalation.

#### Dependencies
- **AUTH-02** — Login, logout and session management (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="asc-01"></a>

### [ASC-01] Association and chapter data models

#### Objective
Represent Sri Lankan associations, regional chapters and scoped memberships.

#### Planning metadata
- Planning ID: **ASC-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Add migrated Prisma models for associations, chapters, memberships and application decisions with explicit statuses.
- [ ] Define ownership, chapter-to-association relationships, uniqueness and indexes for member/status queries.
- [ ] Document association registration/approval and membership state transitions; separate pending associations from publicly approved ones.
- [ ] Seed synthetic associations/chapters and test referential integrity and duplicate membership constraints.

#### Dependencies
- **INF-03** — Configure PostgreSQL and Prisma (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="asc-02"></a>

### [ASC-02] Association directory and detail APIs

#### Objective
Expose safe association discovery and controlled association management.

#### Planning metadata
- Planning ID: **ASC-02** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Provide paginated public directory/detail endpoints for approved associations and their public chapters.
- [ ] Provide validated association registration and scoped management endpoints with explicit platform approval policy.
- [ ] Expose public metadata only; exclude private member/contact data from public responses.
- [ ] Test search/pagination, unavailable associations and staff scope violations; document response contracts.

#### Dependencies
- **ASC-01** — Association and chapter data models (Backend).
- **AUTH-05** — Role-based authorization (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="asc-04"></a>

### [ASC-04] Membership application workflow

#### Objective
Implement member application and association/chapter approval.

#### Planning metadata
- Planning ID: **ASC-04** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Allow authenticated users to apply to a valid association/chapter and inspect their application status.
- [ ] Allow authorized association administrators and assigned regional coordinators to review only their scope; define approve/reject/withdraw transitions.
- [ ] Enforce duplicate prevention and transactional decisions, recording reviewer, timestamps and reason without accepting caller identity.
- [ ] Test concurrent applications/decisions, invalid transitions and cross-region access; document active/suspended/withdrawn membership semantics.

#### Dependencies
- **ASC-01** — Association and chapter data models (Backend).
- **ASC-02** — Association directory and detail APIs (Backend).
- **AUTH-05** — Role-based authorization (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="flw-01"></a>

### [FLW-01] Flower categories and listing schema

#### Objective
Model flower/nursery listings, category taxonomy and media metadata.

#### Planning metadata
- Planning ID: **FLW-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Create Prisma models/migrations for categories, owner-linked listings and ordered gallery records.
- [ ] Define botanical/common name, description, grower/location, availability and draft/pending/published/rejected states.
- [ ] Set constraints and query indexes; store Cloudinary metadata/references rather than image binaries.
- [ ] Seed representative Sri Lankan sample categories/listings and verify public visibility excludes unapproved records.

#### Dependencies
- **INF-03** — Configure PostgreSQL and Prisma (Backend).
- **AUTH-01** — User registration API (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="flw-02"></a>

### [FLW-02] Flower listing CRUD API

#### Objective
Let growers manage listings with a moderation lifecycle.

#### Planning metadata
- Planning ID: **FLW-02** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Implement validated owner-scoped create/read/update/delete or archive endpoints with documented status transitions.
- [ ] Provide safe public detail for published listings and owner access to drafts/review feedback.
- [ ] Enforce ownership and publish/moderation permissions on the backend; reject owner/status escalation.
- [ ] Test unauthorized/cross-owner access, invalid categories, missing resources and lifecycle rules; document OpenAPI.

#### Dependencies
- **FLW-01** — Flower categories and listing schema (Backend).
- **AUTH-05** — Role-based authorization (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="flw-03"></a>

### [FLW-03] Secure image upload integration

#### Objective
Add authenticated Cloudinary image storage for listing galleries.

#### Planning metadata
- Planning ID: **FLW-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Use a documented signed upload flow suited to Vercel limits; keep Cloudinary secrets server-side.
- [ ] Validate size, count, allowed image formats and ownership before signing/finalizing an upload.
- [ ] Persist verified media metadata and constrain replacement/deletion to the owner; handle orphan cleanup and provider failure.
- [ ] Test malicious file metadata, unauthorized assets, quota violations and secret redaction; do not rely on ephemeral local disk.

#### Dependencies
- **FLW-01** — Flower categories and listing schema (Backend).
- **AUTH-05** — Role-based authorization (Backend).
- **INF-09** — Security middleware and logging (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="flw-06"></a>

### [FLW-06] Catalogue search, filters and pagination

#### Objective
Provide bounded and predictable public catalogue queries.

#### Planning metadata
- Planning ID: **FLW-06** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Support documented text, category, region/grower and availability filters on published listings.
- [ ] Validate and cap pagination/query sizes; use stable sorting with deterministic tie-breaking.
- [ ] Return consistent pagination metadata and preserve public visibility rules for every filter combination.
- [ ] Test combined filters, special characters, empty results, invalid values and relevant database query plans.

#### Dependencies
- **FLW-02** — Flower listing CRUD API (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="ann-01"></a>

### [ANN-01] Association announcement API

#### Objective
Publish announcements with correct association/member visibility.

#### Planning metadata
- Planning ID: **ANN-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P0** (MVP critical)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Model and implement staff announcement draft/publish/update/archive and paginated history endpoints.
- [ ] Support explicit public, association-member and chapter-targeted visibility with authoritative membership checks.
- [ ] Limit publishing to scoped staff; enforce private visibility on list, detail and direct-ID requests.
- [ ] Test outsiders, pending/inactive members, cross-chapter access and archive behavior; document contracts.

#### Dependencies
- **ASC-04** — Membership application workflow (Backend).
- **AUTH-05** — Role-based authorization (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="ann-03"></a>

### [ANN-03] Official-source notice references

#### Objective
Allow staff to reference verified external government notices without claiming endorsement.

#### Planning metadata
- Planning ID: **ANN-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **2**
- Priority: **P1** (Important)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Store source organization, original HTTPS URL, publication date and reviewer/verification timestamp.
- [ ] Require authorized verification before an announcement is presented as source-checked; keep an edit history.
- [ ] Validate URLs and reject unsafe schemes; avoid arbitrary server-side URL fetching or implement explicit SSRF protection if fetching is introduced.
- [ ] Return clear third-party attribution/disclaimer fields; no automatic government-system integration or endorsement claims.

#### Dependencies
- **ANN-01** — Association announcement API (Backend).
- **AUTH-05** — Role-based authorization (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="evt-01"></a>

### [EVT-01] Events and exhibitions API

#### Objective
Publish scoped exhibitions, workshops and association events.

#### Planning metadata
- Planning ID: **EVT-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **3**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Add migrated events model and organizer-scoped CRUD/publish/cancel endpoints.
- [ ] Validate start/end, Asia/Colombo display semantics, venue/location, capacity and eligibility.
- [ ] Provide paginated public/member event list/detail according to visibility and event state.
- [ ] Test invalid dates, outsider organizer edits, cancellation and unpublished visibility; document OpenAPI.

#### Dependencies
- **ASC-04** — Membership application workflow (Backend).
- **AUTH-05** — Role-based authorization (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="evt-03"></a>

### [EVT-03] Event registration and capacity handling

#### Objective
Register eligible members without overselling event capacity.

#### Planning metadata
- Planning ID: **EVT-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **3**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Create unique member/event registrations and validated register/cancel endpoints.
- [ ] Enforce eligibility, registration window and available capacity atomically under concurrent requests.
- [ ] Provide scoped organizer attendee lists and attendance marking without public personal-data leakage.
- [ ] Test parallel requests for the last slot, duplicates, cancellation, unauthorized attendance edits and event cancellation.

#### Dependencies
- **EVT-01** — Events and exhibitions API (Backend).
- **AUTH-05** — Role-based authorization (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="com-01"></a>

### [COM-01] Community posts and comments API

#### Objective
Support bounded, safe knowledge-sharing discussions.

#### Planning metadata
- Planning ID: **COM-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **3**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Model posts/comments with authors, scope, timestamps and moderation states.
- [ ] Implement validated paginated read and owner-scoped write/edit/delete endpoints.
- [ ] Enforce association/private scope when applicable and safe text handling, size limits and write rate limits.
- [ ] Test cross-author modification, removed content, malformed input and private-scope access; document moderation integration points.

#### Dependencies
- **AUTH-05** — Role-based authorization (Backend).
- **INF-05** — API standards and OpenAPI specification (Backend).
- **INF-09** — Security middleware and logging (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="com-03"></a>

### [COM-03] Community reporting and moderation

#### Objective
Provide member reports and scoped review outcomes.

#### Planning metadata
- Planning ID: **COM-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **3**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Add validated report submission with bounded categories/reasons and duplicate handling.
- [ ] Provide scoped moderation queue and documented hide/restore/dismiss actions with reasons.
- [ ] Record moderator identity, timestamps and decisions; prevent reporters from reading private queues.
- [ ] Test scope violations, repeated reports, concurrent review and visibility changes; integrate shared audit logging when available.

#### Dependencies
- **COM-01** — Community posts and comments API (Backend).
- **AUTH-05** — Role-based authorization (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="not-01"></a>

### [NOT-01] In-app notification system

#### Objective
Create recipient-scoped notifications for membership and announcement events.

#### Planning metadata
- Planning ID: **NOT-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **3**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Model notifications and idempotent event-to-recipient creation with explicit audience rules.
- [ ] Provide own-notification list, unread count and mark-read endpoints.
- [ ] Prevent duplicate delivery on retries and exclude unauthorized or inactive recipients as defined by policy.
- [ ] Test recipient isolation, pagination, replayed events and read state; design event adapters for future events/inquiries.

#### Dependencies
- **AUTH-05** — Role-based authorization (Backend).
- **ASC-04** — Membership application workflow (Backend).
- **ANN-01** — Association announcement API (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="not-03"></a>

### [NOT-03] Email notification preferences

#### Objective
Add optional email preferences and reliable notification delivery.

#### Planning metadata
- Planning ID: **NOT-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **3**
- Priority: **P2** (Enhancement)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Store member preferences per supported notification type and expose own-settings endpoints.
- [ ] Respect opt-out for nonessential mail while documenting essential security email policy.
- [ ] Use a retry-capable, idempotent serverless-compatible delivery mechanism; avoid in-process background jobs after a response.
- [ ] Test unsubscribe authorization, preference enforcement, retries and provider failure; keep email addresses and tokens out of logs.

#### Dependencies
- **NOT-01** — In-app notification system (Backend).
- **AUTH-04** — Email verification and password recovery (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="mkt-01"></a>

### [MKT-01] Buyer inquiry and seller response APIs

#### Objective
Enable buyer-to-grower inquiries without payments or fulfillment.

#### Planning metadata
- Planning ID: **MKT-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **4**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Model inquiries/messages linked to buyer, seller and listing with documented statuses.
- [ ] Implement validated creation, participant-only list/detail, seller response and permitted status transitions.
- [ ] Enforce participant identity, rate limits and private contact handling; prevent arbitrary seller spoofing.
- [ ] Test cross-user access, unavailable listings, duplicates and state transitions; explicitly exclude checkout, payments and delivery.

#### Dependencies
- **FLW-02** — Flower listing CRUD API (Backend).
- **AUTH-05** — Role-based authorization (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="mkt-03"></a>

### [MKT-03] Listing availability management

#### Objective
Keep listing availability accurate for owners and prospective buyers.

#### Planning metadata
- Planning ID: **MKT-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **4**
- Priority: **P1** (Important)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Define and validate supported availability states and optional bounded stock information without creating a payment/order system.
- [ ] Provide owner-scoped updates with concurrency/version safeguards and timestamps.
- [ ] Reflect availability consistently in public catalogue filters and inquiry eligibility.
- [ ] Test stale updates, cross-owner edits, negative values and availability changes during inquiry creation.

#### Dependencies
- **FLW-02** — Flower listing CRUD API (Backend).
- **MKT-01** — Buyer inquiry and seller response APIs (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="adm-01"></a>

### [ADM-01] Platform moderation and audit logs

#### Objective
Give platform staff controlled moderation with traceable decisions.

#### Planning metadata
- Planning ID: **ADM-01** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **4**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Provide scoped user, association and listing approval/moderation endpoints with reasons and documented transitions.
- [ ] Store append-only audit records with actor, action, target, timestamp and safe change summaries.
- [ ] Restrict audit access and avoid recording passwords, tokens or unnecessary personal data; define retention policy.
- [ ] Test privilege escalation, listing approval, member suspension and tamper attempts; MVP listing approval slice should land before full Phase 4 scope.

#### Dependencies
- **AUTH-05** — Role-based authorization (Backend).
- **FLW-02** — Flower listing CRUD API (Backend).
- **ASC-04** — Membership application workflow (Backend).
- **COM-03** — Community reporting and moderation (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="adm-03"></a>

### [ADM-03] Aggregated analytics APIs

#### Objective
Provide scoped aggregate reporting without personal-data exposure.

#### Planning metadata
- Planning ID: **ADM-03** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **4**
- Priority: **P2** (Enhancement)
- Relative size: **M** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Expose member/status, listing/availability and association activity aggregates with documented definitions/date ranges.
- [ ] Apply platform/association/chapter scope consistently and avoid returning raw personal records.
- [ ] Validate bounded periods, timezone rules and zero-data responses; document aggregation refresh/caching.
- [ ] Test metric correctness with seeded records, scoped results and representative query cost.

#### Dependencies
- **ADM-01** — Platform moderation and audit logs (Backend).
- **ASC-04** — Membership application workflow (Backend).
- **FLW-02** — Flower listing CRUD API (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="qlt-02"></a>

### [QLT-02] Authorization and upload security regression

#### Objective
Verify hostile requests cannot bypass ownership, roles, scopes or upload constraints.

#### Planning metadata
- Planning ID: **QLT-02** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **5**
- Priority: **P1** (Important)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Test every implemented role against cross-user/association/chapter/region resource access and direct-ID enumeration.
- [ ] Exercise session expiry/revocation, CSRF/cookie settings, validation, rate limits and malicious upload cases.
- [ ] Verify private announcements, inquiry data and audit information remain scoped; confirm secrets are absent from errors/logs.
- [ ] Record reproducible findings and fixes; require no unresolved critical/high findings at release, including MVP stabilization before later phases.

#### Dependencies
- **AUTH-05** — Role-based authorization (Backend).
- **ASC-04** — Membership application workflow (Backend).
- **FLW-03** — Secure image upload integration (Backend).
- **ANN-01** — Association announcement API (Backend).
- **ADM-01** — Platform moderation and audit logs (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="qlt-04"></a>

### [QLT-04] API performance and database query optimization

#### Objective
Measure representative API/database load and tune actual bottlenecks.

#### Planning metadata
- Planning ID: **QLT-04** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **5**
- Priority: **P2** (Enhancement)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Define reproducible small-load fixtures and endpoint mix, with cold/warm Vercel conditions identified.
- [ ] Measure p50/p95, error rates, connection use and query counts; evaluate the proposed p95 <800 ms ordinary-read target.
- [ ] Fix demonstrated N+1 queries/index/connection issues and compare before/after while preserving authorization.
- [ ] Document limits, load scripts and results; do not treat proposed targets as existing measurements.

#### Dependencies
- **INF-03** — Configure PostgreSQL and Prisma (Backend).
- **FLW-06** — Catalogue search, filters and pagination (Backend).
- **ADM-03** — Aggregated analytics APIs (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---

<a id="qlt-06"></a>

### [QLT-06] Advanced catalogue search

#### Objective
Improve catalogue relevance after validating actual search needs.

#### Planning metadata
- Planning ID: **QLT-06** (scope v1.0; not a GitHub issue number)
- Repository: **TourGo-App/FloraConnect-Backend**
- Phase: **5**
- Priority: **P2** (Enhancement)
- Relative size: **L** — not a fixed duration; split large work into reviewable PRs.
- Current status: **Not started**

#### Acceptance criteria
- [ ] Document representative Sinhala/Tamil/English and botanical/common-name queries with expected relevance.
- [ ] Evaluate PostgreSQL full-text/trigram/index approaches using measured baseline and agreed matching rules.
- [ ] Preserve visibility, bounded pagination, input validation and existing filter compatibility.
- [ ] Test relevance, Unicode/special characters and performance; expose a documented compatible API without adding unrequested intelligent diagnosis.

#### Dependencies
- **FLW-06** — Catalogue search, filters and pagination (Backend).
- **QLT-04** — API performance and database query optimization (Backend).

#### Verification and PR evidence
- Include automated tests appropriate to the behavior and important failure/permission cases; explain any test gaps.
- Run the repository's existing checks and include results plus setup/migration/API-contract changes in the PR.
- Include representative HTTP request/response evidence and negative authorization/validation cases for API changes; use disposable data and never production credentials.

#### Scope and contributor workflow
- Follow FloraConnect scope v1.0: Sri Lankan growers, nurseries, associations and enthusiasts; modular REST API and the existing React/Vite or Express/TypeScript stack.
- Preserve backend-enforced roles, ownership, association/chapter scope and private member data. Frontend visibility is not authorization.
- Initial releases exclude online payments/order fulfillment, shipping, automatic government integration or endorsement, AI diagnosis, native mobile apps and advanced real-time chat.
- Request maintainer assignment before starting; no contributor is assigned by this issue. Use a focused branch and link this issue in the PR. Maintainer review and passing CI precede merge.
- Do not change repository ownership/license notices or grant access to private TourGo repositories as part of this task.


---
