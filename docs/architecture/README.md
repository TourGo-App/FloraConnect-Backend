# Backend structure

```text
src/
  app.ts                   Express composition and Vercel default export
  server.ts                Local/standalone HTTP listener
  config/env.ts            Environment parsing and defaults
  middleware/
    cors.ts                Frontend origin configuration
    not-found.ts           JSON 404 response
  routes/index.ts          /api route composition
  modules/
    health/
      health.controller.ts Liveness response
      health.routes.ts     Health module router
    auth/                  Reserved feature module
    users/
    associations/
    flowers/
    announcements/
    events/
tests/integration/         Supertest endpoint and CORS tests
prisma/                    Reserved database schema/migrations
  (database not configured yet)
docs/
  architecture/            Folder conventions
  issues/                  Development backlog
```

## Conventions

- Keep app.ts responsible for middleware and module composition; never start a listener there. Vercel detects this file directly.
- Add feature routes, controllers and, when needed, services/validation inside the relevant module. Do not create empty service/repository layers until they have a responsibility.
- Mount module routers through src/routes/index.ts and preserve the /api prefix.
- Use configuration from config and cross-cutting handlers from middleware.
- Keep database schema/migrations in prisma once implemented; do not claim database readiness from the liveness endpoint.
- Keep API integration tests under tests/integration. Use .js extensions in TypeScript imports for NodeNext output.
- Do not add a top-level api function alongside Vercel's Express preset: it previously shadowed /api routes.
- Run npm run typecheck, npm test and npm run build after changes. dist is generated output.
