# Resolve production login 503 responses

The observed production login returned 503 after about five seconds while basic liveness returned 200. The backend Vercel environment-variable screen showed no configured variables. The local .env is ignored by Git and is not deployed. The localhost URI in .env.example is a local-development example; on Vercel it points to the cloud function itself, not the developer laptop.

## Configure the backend project

1. Open the flora-connect-backend Vercel project, Settings, Environment Variables.
2. Add MONGODB_URI with Type Secret and environment Production.
3. Copy only the real Atlas connection-string value from the ignored backend .env, beginning mongodb+srv://. Do not include MONGODB_URI=, quotes or the localhost example. Do not publish the value in issues, PRs or screenshots.
4. Save the variable, then redeploy the latest production deployment. Environment changes affect new deployments, not an already-running deployment.
5. After this PR is deployed, /api/health/db establishes a connection on cold requests and reports connected only when the driver is connected. Test login through the frontend proxy as well.

No additional secret is needed for this field: Secret is Vercel's variable type. Do not set PORT for the serverless deployment. The frontend must not receive MONGODB_URI; its existing /api rewrite forwards requests to the backend. Configure Preview separately if a preview deployment needs database access, preferably with a staging database.

## Diagnostics and recovery

- DATABASE_NOT_CONFIGURED: a missing, malformed or loopback Vercel connection string. Check the backend project/environment and redeploy.
- DATABASE_UNAVAILABLE: configuration exists but the driver could not connect. Inspect the sanitized connection reason in backend logs and check Atlas cluster availability, credentials, DNS and permitted network access for the deployed backend. Allowing only a laptop's IP does not allow cloud egress.
- /api/health remains a database-independent liveness check; 200 there does not prove login/storage works.
- Connection attempts are shared and cleared after settling. A disconnected cached connection is re-established instead of reusing an already-resolved stale promise.

The application never bypasses authentication, returns a synthetic login success, embeds connection strings in source, or sends raw driver errors to browsers. Logging classifies failures without printing credentials, hosts or raw error messages.

Sources: https://vercel.com/docs/environment-variables and https://www.mongodb.com/docs/atlas/troubleshoot-connection/ .
