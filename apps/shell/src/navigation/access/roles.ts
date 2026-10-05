// ⏳ PENDIENTE: definición de roles autorizados en el sistema (por ahora solicitante)
import type { Role } from "../registry/types";

export const ROLES: readonly Role[] = ["solicitante"] as const;
export const DEFAULT_ROLE: Role = "solicitante";
