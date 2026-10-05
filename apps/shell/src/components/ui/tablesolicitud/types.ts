export type ProgresoEstado =
  | "recibido"
  | "observado por forma"
  | "completo"
  | "asignado"
  | "en evaluación"
  | "en deliberación"
  | "dictaminado"
  | "archivado";

export interface SolicitudItem {
  id: string;
  fecha: string;
  finalizado: "NO" | "Si";
  evaluacion: "En espera" | "ENTREGADA" | "En revisión" | "Aprobada" | "Observada";
  progreso: ProgresoEstado;
}

export const MOCK_SOLICITUDES: SolicitudItem[] = [
  {
    id: "UID Solicitud",
    fecha: "9/26/2026",
    finalizado: "NO",
    evaluacion: "En espera",
    progreso: "en evaluación",
  },
  {
    id: "UID Solicitud",
    fecha: "9/26/2026",
    finalizado: "Si",
    evaluacion: "ENTREGADA",
    progreso: "dictaminado",
  },
  {
    id: "SOL-2026-003",
    fecha: "10/02/2026",
    finalizado: "NO",
    evaluacion: "En revisión",
    progreso: "en deliberación",
  },
];
