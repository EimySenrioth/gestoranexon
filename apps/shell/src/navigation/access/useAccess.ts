// ⏳ PENDIENTE: hook para obtener módulos visibles y permisos según la sesión del usuario
import { MODULES } from "../registry/modules";
import type { ModuleDefinition } from "../registry/types";

export function useAccess(): { modules: ModuleDefinition[] } {
  return {
    modules: MODULES,
  };
}
