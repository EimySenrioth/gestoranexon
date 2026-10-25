/**
 * Servicio dedicado para la gestión y creación de expedientes en el Frontend (Shell).
 * Se comunica con el backend NestJS y la base de datos PostgreSQL mediante apiClient.
 */

import { apiClient } from "@/services/api.client";
import { SolicitudCompletaData } from "../types/wizard.types";
import { SolicitudItem, PaginadoResultado } from "../types/tabla.types";

export interface QueryMisSolicitudesParams {
  page?: number;
  limit?: number;
}

export interface ExpedienteResponse {
  id: string;
  codigo: string;
  titulo: string;
  estado: string;
  solicitanteId: string;
  creadoEn: string;
  codigoExpediente?: string;
}

/**
 * Guarda y almacena un nuevo expediente en la base de datos PostgreSQL.
 * Transforma los datos del wizard al contrato del backend.
 */
export async function guardarExpediente(
  data: SolicitudCompletaData
): Promise<ExpedienteResponse> {
  const payload = {
    // Paso 1: Datos Generales
    titulo: data.datosGenerales.titulo?.trim(),
    tipoSolicitud: data.datosGenerales.tipoSolicitud || "NA",
    motivoSolicitud: data.datosGenerales.motivoSolicitud?.trim(),
    investigadores: data.datosGenerales.investigadores || [],
    unidadAcademica: data.datosGenerales.unidadAcademica || "NA",
    tipoInvestigacion: data.datosGenerales.tipoInvestigacion || undefined,
    tipoInvestigacionOtro: data.datosGenerales.tipoInvestigacionOtro || undefined,
    financiamiento: data.datosGenerales.financiamiento || undefined,
    financiamientoDetalle: data.datosGenerales.financiamientoDetalle || undefined,

    // Datos de Asunto del Pedido (Audio y Archivos Adjuntos - ZIP, PDF, Office)
    tieneAudioAsunto: !!data.datosGenerales.audioAsunto,
    archivosAsuntoInfo: (data.datosGenerales.archivosAsunto || []).map((f) => ({
      nombre: f.name,
      tamanioBytes: f.size,
      formato: f.name.split(".").pop()?.toLowerCase() || "",
    })),

    // Paso 2: Expediente
    codigoSolicitante: data.expediente.codigoSolicitante || undefined,
    naturalezaProyecto: data.expediente.naturalezaProyecto || undefined,
    participantes: data.expediente.participantes || [],
    modalidad: data.expediente.modalidad || undefined,
    planProyecto: data.expediente.planProyecto || undefined,
  };

  return await apiClient.post<ExpedienteResponse>("/api/v1/expedientes", payload);
}

/**
 * Sube un archivo (audio o anexo) asociado a un expediente/ticket.
 */
export async function subirDocumentoExpediente(
  ticketId: string,
  file: File,
  tipoDocumental: string
): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("tipoDocumental", tipoDocumental);

  return await apiClient.postFormData(
    `/api/v1/documents/upload/ticket/${ticketId}`,
    formData
  );
}

/**
 * Consulta la lista de expedientes registrados en PostgreSQL para el usuario autenticado.
 * (Mantenido para compatibilidad con otros roles o vistas completas).
 */
export async function listarExpedientes(): Promise<ExpedienteResponse[]> {
  try {
    return await apiClient.get<ExpedienteResponse[]>("/api/v1/expedientes");
  } catch (error) {
    console.warn("[expedientes.service] Error o BD vacía al listar expedientes.");
    return [];
  }
}

/**
 * Consulta la lista paginada de solicitudes del solicitante actual
 * optimizada exclusivamente para las columnas de la tabla.
 */
export async function listarMisSolicitudes(
  params: QueryMisSolicitudesParams = { page: 1, limit: 10 }
): Promise<PaginadoResultado<SolicitudItem>> {
  return await apiClient.get<PaginadoResultado<SolicitudItem>>(
    "/api/v1/expedientes/mis-solicitudes",
    { params: { page: params.page, limit: params.limit } }
  );
}

/**
 * Consulta el detalle de un expediente por su ID.
 */
export async function obtenerExpediente(id: string): Promise<any> {
  return await apiClient.get(`/api/v1/expedientes/${id}`);
}

