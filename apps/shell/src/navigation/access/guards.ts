import type { Role, ModuleId } from "../registry/types";
import { MODULES } from "../registry/modules";

export function canAccess(roles: Role | Role[], moduleId: ModuleId): boolean {
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod) return false;

  const userRoles = Array.isArray(roles) ? roles : [roles];
  return userRoles.some((r) => mod.roles.includes(r));
}

export function homePathFor(role?: Role | Role[]): string {
  if (!role) return "/inicio";

  const userRoles = Array.isArray(role) ? role : [role];
  const isOnlySolicitante =
    userRoles.length === 1 &&
    (userRoles[0] === "SOLICITANTE" || userRoles[0] === "solicitante");

  return isOnlySolicitante ? "/inicio" : "/homeview2";
}
