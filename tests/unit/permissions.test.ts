import { describe, expect, it } from "vitest";
import {
  effectivePermissions,
  permissionIds,
  rolePolicy,
} from "../../src/modules/auth/auth.permissions.js";

describe("Role-bounded permissions", () => {
  it("preserves role defaults for accounts created before permission overrides", () => {
    expect(effectivePermissions({ role: "PLATFORM_ADMIN" })).toEqual(
      rolePolicy.PLATFORM_ADMIN.permissions,
    );
  });
  it("cannot elevate a user or platform administrator through injected grants", () => {
    for (const role of [
      "USER",
      "PLATFORM_ADMIN",
      "ORGANIZATION_ADMIN",
      "FLORIST",
      "GROWER",
    ]) {
      const permissions = effectivePermissions({
        role,
        permissions: ["users.access.manage", "users.create", "profile.update"],
      });
      expect(permissions).not.toContain("users.access.manage");
      expect(permissions).not.toContain("users.create");
    }
  });
  it("keeps mandatory recovery access while respecting explicit revocations", () => {
    expect(
      effectivePermissions({ role: "PLATFORM_ADMIN", permissions: [] }),
    ).toEqual(["profile.read", "password.change"]);
  });
  it("always retains full Super Admin access", () => {
    expect(
      effectivePermissions({ role: "SUPER_ADMIN", permissions: [] }),
    ).toEqual(permissionIds);
  });
  it("does not interpret organization positions or unknown identifiers as roles", () => {
    expect(
      effectivePermissions({ role: "PRESIDENT", permissions: permissionIds }),
    ).toEqual([]);
    expect(effectivePermissions({ role: "__proto__" })).toEqual([]);
  });
});
