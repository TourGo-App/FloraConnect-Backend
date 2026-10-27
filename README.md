# FloraConnect Backend

Milestone 1: a small Express + TypeScript API that runs locally and on Vercel. This project is independent of TourGo.

## Requirements and local development

Use Node.js 22 LTS and npm.

```sh
npm ci
npm run dev
```

Visit http://localhost:3001/api/health:

```json
{
  "status": "ok",
  "service": "FloraConnect API"
}
```

No environment variables, database, or third-party services are required. `PORT` may override the default port of 3001. For example, in PowerShell: `$env:PORT=3002; npm run dev`. The `.env.example` is documentation; this milestone does not automatically load `.env` files.

The endpoint reports application liveness, not database readiness. Responses use `Cache-Control: no-store`. Unknown routes return a JSON 404.

## Validation and standalone build

```sh
npm run typecheck
npm test
npm run build
npm start
```

Vitest and Supertest check the health response, the serverless entry point, and unknown routes. Build output is written to `dist/` and excluded from Git.

## Project structure

- `src/app.ts`: shared Express application, exported without opening a port.
- `src/server.ts`: local/standalone listener.
- `src/routes/index.ts`: API routes, mounted at `/api`.
- Vercel uses `src/app.ts` directly through the Express preset. Keep standalone Vercel Functions out of `api/` to avoid shadowing the Express `/api` routes.
- `tests/health.test.ts`: HTTP contract tests.
- `src/config/`, `src/middleware/`, `src/modules/`: placeholders for future features.
- `prisma/`: reserved for the next milestone. No database schema or client is configured yet.

Future modules: auth, users, associations, flowers, announcements, and events. PostgreSQL/Neon, Prisma, Zod, JWT cookies, Argon2id, Cloudinary, and OpenAPI documentation will be added when those features are implemented.

## Deploy to Vercel

1. Import `TourGo-App/FloraConnect-Backend` into your Vercel account.
2. Name the project `floraconnect-backend` if available, and select the repository root as the Root Directory.
3. Use the Express framework preset and Node.js 22.x. `vercel.json` supplies `npm ci --include=dev` and `npm run build`; do not configure a frontend/static output directory. TypeScript is pinned to 5.9.3 for deployment compatibility, and the install command keeps Node/Express type definitions available during Vercel compilation.
4. Deploy. No environment variables or Neon database are required for this milestone.
5. Visit `/api/health` on the domain Vercel assigns. The intended URL is `https://floraconnect-backend.vercel.app/api/health`, subject to domain availability and project settings.

Vercel detects the default-exported Express app in `src/app.ts`. Local development uses a separate listener so importing the app does not start a server. See the [official Express deployment guide](https://vercel.com/docs/frameworks/backend/express).

A GitHub push alone deploys only after the repository has been linked to a Vercel project with automatic deployments enabled. A public health endpoint also requires deployment protection settings that allow public access.

## Frontend connection

CORS allows `https://flora-connect-frontend.vercel.app`, `http://localhost:5173`, and `http://127.0.0.1:5173` by default. Override this allowlist using the server environment variable `FRONTEND_ORIGINS` with comma-separated exact origins (no trailing slashes). The override replaces the defaults; include every origin you want to allow. Restart or redeploy after changing it. Preview URLs must be added explicitly. CORS grants browser read access and does not replace authentication.
