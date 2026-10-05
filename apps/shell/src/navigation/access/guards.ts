// ⏳ PENDIENTE: validaciones de acceso por rol y rutas de inicio (canAccess, homePathFor)
import type { Role, ModuleId } from "../registry/types";
import { MODULES } from "../registry/modules";

export function canAccess(role: Role, moduleId: ModuleId): boolean {
  const mod = MODULES.find((m) => m.id === moduleId);
  return Boolean(mod?.roles.includes(role));
}

export function homePathFor(_role?: Role): string {
  void _role;
  return "/inicio";
}
