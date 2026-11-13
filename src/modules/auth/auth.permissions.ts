import type { Role } from "./auth.models.js";

export const permissionCatalog = [
  {
    id: "profile.read",
    name: "View own account",
    category: "Account",
    configurable: false,
  },
  {
    id: "password.change",
    name: "Change own password",
    category: "Account",
    configurable: false,
  },
  {
    id: "profile.update",
    name: "Edit own profile",
    category: "Account",
    configurable: true,
  },
  {
    id: "overview.read",
    name: "View administration overview",
    category: "Administration",
    configurable: true,
  },
  {
    id: "applications.read",
    name: "View verification applications",
    category: "Verification",
    configurable: true,
  },
  {
    id: "applications.review",
    name: "Approve or reject applications",
    category: "Verification",
    configurable: true,
  },
  {
    id: "users.read",
    name: "View platform users",
    category: "Users",
    configurable: true,
  },
  {
    id: "users.create",
    name: "Create users",
    category: "Users",
    configurable: true,
  },
  {
    id: "users.update",
    name: "Edit user details",
    category: "Users",
    configurable: true,
  },
  {
    id: "users.status",
    name: "Suspend or reactivate users",
    category: "Users",
    configurable: true,
  },
  {
    id: "users.access.manage",
    name: "Assign roles and permissions",
    category: "Users",
    configurable: true,
  },
  {
    id: "organizations.read",
    name: "View organization directory",
    category: "Platform",
    configurable: true,
  },
  {
    id: "businesses.read",
    name: "View business directory",
    category: "Platform",
    configurable: true,
  },
  {
    id: "analytics.read",
    name: "View platform analytics",
    category: "Platform",
    configurable: true,
  },
  {
    id: "audit.read",
    name: "View audit records",
    category: "Administration",
    configurable: true,
  },
  {
    id: "roles.read",
    name: "View roles and access policy",
    category: "Administration",
    configurable: true,
  },
] as const;
export type Permission = (typeof permissionCatalog)[number]["id"];
export const permissionIds = permissionCatalog.map(
  (permission) => permission.id,
);
const accountPermissions: Permission[] = [
  "profile.read",
  "password.change",
  "profile.update",
];
export const rolePolicy: Record<
  Role,
  {
    name: string;
    description: string;
    scope: string;
    permissions: Permission[];
  }
> = {
  SUPER_ADMIN: {
    name: "Super Admin",
    description:
      "Full access to implemented platform administration, user provisioning, and access management.",
    scope: "Entire platform",
    permissions: [...permissionIds],
  },
  PLATFORM_ADMIN: {
    name: "Platform Admin",
    description:
      "Restricted staff workspace for application review. Cannot manage users, administrator roles, or global settings.",
    scope: "Application review workspace",
    permissions: [
      ...accountPermissions,
      "overview.read",
      "applications.read",
      "applications.review",
    ],
  },
  ORGANIZATION_ADMIN: {
    name: "Organization Admin",
    description:
      "Linked to an assigned organization through membership. Organizational titles never grant platform administration.",
    scope: "Assigned organization and own account",
    permissions: [...accountPermissions],
  },
  ORGANIZATION_MEMBER: {
    name: "Organization Member",
    description:
      "Organization membership without platform administration. Organization position is recorded separately.",
    scope: "Assigned membership and own account",
    permissions: [...accountPermissions],
  },
  FLORIST: {
    name: "Florist",
    description:
      "Linked to a florist business. Business status and ownership apply; this role does not grant platform administration.",
    scope: "Owned florist business and own account",
    permissions: [...accountPermissions],
  },
  GROWER: {
    name: "Grower",
    description:
      "Linked to a grower business. Business status and ownership apply; this role does not grant platform administration.",
    scope: "Owned grower business and own account",
    permissions: [...accountPermissions],
  },
  USER: {
    name: "User",
    description:
      "Authenticated personal account without administrative access.",
    scope: "Own account",
    permissions: [...accountPermissions],
  },
};
export function effectivePermissions(user: {
  role: string;
  permissions?: readonly string[] | null;
}): Permission[] {
  const policy = Object.hasOwn(rolePolicy, user.role)
    ? rolePolicy[user.role as Role]
    : undefined;
  if (!policy) return [];
  if (user.role === "SUPER_ADMIN" || user.permissions == null)
    return [...policy.permissions];
  return policy.permissions.filter(
    (id) =>
      permissionCatalog.some((p) => p.id === id && !p.configurable) ||
      user.permissions!.includes(id),
  );
}
