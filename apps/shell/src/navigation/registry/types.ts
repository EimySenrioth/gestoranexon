export type Role =
  | "SOLICITANTE"
  | "EVALUADOR"
  | "PRESIDENTE_CEI"
  | "VICEPRESIDENTE_CEI"
  | "SECRETARIA_TECNICA_CEI"
  | "SECRETARIA_ADMINISTRATIVA_CEI"
  | "VOCAL_CEI"
  | "ADMINISTRADOR"
  | "solicitante";

export type ModuleId = "inicio" | "solicitudes" | "homeview2" | "evaluacion";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  path: string;
  roles: Role[];
  icon?: string;
}
