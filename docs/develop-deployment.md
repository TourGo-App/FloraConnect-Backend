# Main and develop frontend origins

The development API is https://flora-connect-backend-infr.vercel.app; the matching
frontend is https://flora-connect-frontend-qemd.vercel.app.

Set the following **Config** values in the development backend Vercel project's
deployment environment and redeploy:

```dotenv
FRONTEND_ORIGINS=https://flora-connect-frontend.vercel.app,https://flora-connect-frontend-qemd.vercel.app
FRONTEND_URL=https://flora-connect-frontend-qemd.vercel.app
```

The HTTPS-only allowlist permits requests from the two exact frontend origins.
It does not authorize any account or expand RBAC. No wildcard Vercel-domain access
is granted. Do not include a trailing slash, path, quotes, `KEY=`, localhost or
plain HTTP in hosted values. `FRONTEND_URL` is a single canonical verification-link
origin, not a comma-separated list. Keep it pointing to the main frontend in the
main backend environment; use the development frontend in this development backend.

Preserve `MONGODB_URI` as a backend-only **Secret**, preferably for a separate
development database. The existing verification mail adapter and its token also
remain backend-only settings. Do not copy these secrets into the frontend or Git.
Do not set PORT for Vercel. Never copy the local MongoDB example to Vercel.

If the separate development project's deployed branch is its Production branch,
select Production. If `develop` is a Preview branch in a shared project, select
Preview and scope the overrides to `develop`. Save and redeploy the backend before
rechecking the frontend. Local ignored `.env` files do not configure deployments.

Local `.env` may allow both hosted origins plus `http://localhost:5173` and
`http://127.0.0.1:5173`; those HTTP entries must not be used in Vercel's HTTPS-only
environment. Start the local backend with `npm run dev`, then the frontend with
its local `API_PROXY_TARGET=http://localhost:3001`.

Check `/api/health` on the backend and through the frontend proxy, then check
database readiness and login without publishing credentials. An unknown origin
must still be denied on protected requests; a recognized origin does not replace
session authentication, CSRF validation or role authorization.

Observed on 2026-11-14: the development backend's database-independent health URL
returned HTTP 500 with `FUNCTION_INVOCATION_FAILED`. The first exception in Vercel
function logs is needed to identify the hosted startup failure. Validate the exact
allowlist first: malformed values can fail module initialization. A MongoDB change
alone does not establish the cause of a failed liveness function.
