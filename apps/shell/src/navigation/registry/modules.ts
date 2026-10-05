// ⏳ PENDIENTE: fuente única de módulos y rutas del solicitante
import type { ModuleDefinition } from "./types";

export const MODULES: ModuleDefinition[] = [
  {
    id: "inicio",
    label: "Inicio",
    path: "/inicio",
    roles: ["solicitante"],
  },
  {
    id: "solicitudes",
    label: "Solicitudes",
    path: "/solicitudes",
    roles: ["solicitante"],
  },
];
