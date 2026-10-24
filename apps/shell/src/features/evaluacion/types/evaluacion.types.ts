export type EtapaEvaluacion =
  | "Iniciado"
  | "En evaluación"
  | "Evaluado"
  | "Observado"
  | "Dictaminado";

export interface SolicitudFirmaItem {
  id: string;
  ticketId?: string;
  titulo?: string;
  fechaSolicitud: string;
  fechaEvaluacion: string;
  etapaActual: EtapaEvaluacion;
  evaluar: {
    firmado: boolean;
    fechaFirma?: string;
  };
}

export interface PaginadoResultado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryAsignadosParams {
  page?: number;
  limit?: number;
}

export interface BackendEvaluacionItem {
  id: string;
  resultado?: "APROBADO" | "APROBADO_CON_OBSERVACIONES" | "NO_APROBADO" | null;
  actualizadoEn?: string | null;
  creadoEn?: string | null;
}

export interface BackendExpedienteAsignadoItem {
  id: string;
  codigo: string;
  titulo?: string;
  estado: string;
  fechaPresentacion?: string | null;
  creadoEn: string;
  actualizadoEn?: string;
  expediente?: {
    id: string;
    codigo: string;
    estado: string;
    evaluaciones?: BackendEvaluacionItem[];
  } | null;
  solicitante?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  } | null;
}
