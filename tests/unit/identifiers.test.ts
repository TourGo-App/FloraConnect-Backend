import { describe, expect, it } from "vitest";
import {
  User,
  Application,
  Business,
  Organization,
  Membership,
  AuditLog,
} from "../../src/modules/auth/auth.models.js";
import { publicUser } from "../../src/modules/auth/auth.security.js";
import {
  applicationView,
  auditView,
  isPublicId,
} from "../../src/modules/admin/identifiers.js";

describe("Opaque public identifiers", () => {
  it("generates distinct UUID v4 values for administrative resource models", () => {
    const identifiers = [
      User,
      Application,
      Business,
      Organization,
      Membership,
      AuditLog,
    ].flatMap((model: any) => [new model().publicId, new model().publicId]);
    expect(identifiers.every(isPublicId)).toBe(true);
    expect(new Set(identifiers).size).toBe(identifiers.length);
  });
  it.each(["1", "507f1f77bcf86cd799439011", "../users", "", { $ne: null }])(
    "rejects non UUID input %s",
    (id) => {
      expect(isPublicId(id)).toBe(false);
    },
  );
  it("serializes only public identifiers and safe fields", () => {
    const source = {
      _id: "internal",
      publicId: "public",
      name: "Name",
      email: "user@example.test",
      role: "USER",
      passwordHash: "secret",
      verificationTokenHash: "secret",
      actorId: "internal",
      targetId: "internal",
      userId: {
        _id: "internal",
        publicId: "applicant",
        passwordHash: "secret",
      },
    };
    for (const result of [
      publicUser(source),
      applicationView(source),
      auditView(source),
    ]) {
      const output = JSON.stringify(result);
      expect(output).not.toContain("internal");
      expect(output).not.toContain("secret");
      expect(output).not.toContain("_id");
      expect(result.id).toBe("public");
    }
  });
});
