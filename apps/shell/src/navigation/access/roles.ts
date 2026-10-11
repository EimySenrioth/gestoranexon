import type { Role } from "../registry/types";

export const ROLES: readonly Role[] = [
  "SOLICITANTE",
  "EVALUADOR",
  "PRESIDENTE_CEI",
  "VICEPRESIDENTE_CEI",
  "SECRETARIA_TECNICA_CEI",
  "SECRETARIA_ADMINISTRATIVA_CEI",
  "VOCAL_CEI",
  "ADMINISTRADOR",
  "solicitante",
] as const;

export const DEFAULT_ROLE: Role = "SOLICITANTE";
