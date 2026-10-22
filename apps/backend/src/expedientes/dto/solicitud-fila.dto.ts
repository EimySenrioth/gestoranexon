export type EvaluacionEstado =
  | 'En espera'
  | 'Entregada'
  | 'En revisión'
  | 'Aprobada'
  | 'Observada'
  | 'Rechazada'
  | 'Pendiente';

export type ProgresoEstado =
  | 'recibido'
  | 'observado por forma'
  | 'completo'
  | 'asignado'
  | 'en evaluación'
  | 'en deliberación'
  | 'dictaminado'
  | 'archivado'
  | 'pendiente';

export interface SolicitudFilaDto {
  id: string; // Código visual para la columna ID (EXP-YYYY-XXXX o TCK-YYYY-XXXX)
  ticketId: string; // ID real en base de datos para acciones/consultas
  fecha: string; // ISO 8601 o fecha para formateo
  finalizado: boolean;
  evaluacion: EvaluacionEstado;
  progreso: ProgresoEstado;
}

export interface PaginadoResultadoDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
