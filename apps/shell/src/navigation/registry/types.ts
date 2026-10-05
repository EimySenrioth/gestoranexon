// ⏳ PENDIENTE: tipos formales del registro de módulos (ModuleId, Role, ModuleDefinition)
export type Role = "solicitante";

export type ModuleId = "inicio" | "solicitudes";

export interface ModuleDefinition {
  id: ModuleId;
  label: string;
  path: string;
  roles: Role[];
  icon?: string;
}
