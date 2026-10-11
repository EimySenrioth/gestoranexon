// ⏳ PENDIENTE: fuente única de módulos y rutas del solicitante
import type { ModuleDefinition } from "./types";

export const MODULES: ModuleDefinition[] = [
  {
    id: "inicio",
    label: "Inicio",
    path: "/inicio",
    roles: ["SOLICITANTE", "solicitante"],
  },
  {
    id: "solicitudes",
    label: "Solicitudes",
    path: "/solicitudes",
    roles: ["SOLICITANTE", "solicitante"],
  },
  {
    id: "homeview2",
    label: "Evaluación y Comité",
    path: "/homeview2",
    roles: [
      "PRESIDENTE_CEI",
      "VICEPRESIDENTE_CEI",
      "SECRETARIA_TECNICA_CEI",
      "SECRETARIA_ADMINISTRATIVA_CEI",
      "VOCAL_CEI",
      "EVALUADOR",
      "ADMINISTRADOR",
    ],
  },
];
