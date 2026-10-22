export type EvaluacionEstado =
  | "En espera"
  | "Entregada"
  | "ENTREGADA"
  | "En revisión"
  | "Aprobada"
  | "Observada"
  | "Rechazada"
  | "Pendiente";

export type ProgresoEstado =
  | "recibido"
  | "observado por forma"
  | "completo"
  | "asignado"
  | "en evaluación"
  | "en deliberación"
  | "dictaminado"
  | "archivado"
  | "pendiente";

export interface SolicitudItem {
  id: string;
  ticketId?: string;
  fecha: string;
  finalizado: boolean | "Si" | "NO";
  evaluacion: EvaluacionEstado;
  progreso: ProgresoEstado;
}

export interface PaginadoResultado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
