export class DatabaseConfigurationError extends Error {
  readonly code = 'DATABASE_NOT_CONFIGURED';
  constructor() {
    super('The service database is not configured.');
  }
}
export class DatabaseUnavailableError extends Error {
  readonly code = 'DATABASE_UNAVAILABLE';
  constructor() {
    super('The database is temporarily unavailable. Please try again shortly.');
  }
}
export function databaseFailureReason(error: unknown): string {
  const source = error as { code?: unknown; name?: unknown } | null;
  if (source?.code === 18) return 'AUTHENTICATION_FAILED';
  if (['ENOTFOUND', 'ESERVFAIL', 'EAI_AGAIN'].includes(String(source?.code)))
    return 'DNS_LOOKUP_FAILED';
  if (
    [
      'MongoServerSelectionError',
      'MongooseServerSelectionError',
      'MongoNetworkError',
      'MongoNetworkTimeoutError',
    ].includes(String(source?.name))
  )
    return 'CONNECTION_UNREACHABLE';
  return 'CONNECTION_FAILED';
}
