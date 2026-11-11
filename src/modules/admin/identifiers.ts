export const isPublicId = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

// Explicit serializers prevent internal identifiers and future private fields leaking.
export function applicationView(record: any) {
  const applicant = record.userId;
  return {
    id: record.publicId,
    name: record.name,
    type: record.type,
    contact: record.contact,
    location: record.location,
    evidenceUrl: record.evidenceUrl,
    organizationType: record.organizationType,
    position: record.position,
    status: record.status,
    decisionReason: record.decisionReason,
    reviewedAt: record.reviewedAt,
    createdAt: record.createdAt,
    userId: applicant
      ? {
          id: applicant.publicId,
          name: applicant.name,
          email: applicant.email,
          emailVerified: applicant.emailVerified,
          status: applicant.status,
        }
      : null,
  };
}
export function auditView(record: any) {
  return {
    id: record.publicId,
    action: record.action,
    details: record.details,
    createdAt: record.createdAt,
  };
}
