/**
 * Servicio dedicado para la gestión y creación de expedientes en el Frontend (Shell).
 * Se comunica con el backend NestJS y la base de datos PostgreSQL mediante apiClient.
 */

import { apiClient } from "@/services/api.client";
import { SolicitudCompletaData } from "../types/wizard.types";

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
    investigadores: data.datosGenerales.investigadores || [],
    unidadAcademica: data.datosGenerales.unidadAcademica || "NA",
    tipoInvestigacion: data.datosGenerales.tipoInvestigacion || undefined,
    tipoInvestigacionOtro: data.datosGenerales.tipoInvestigacionOtro || undefined,
    financiamiento: data.datosGenerales.financiamiento || undefined,
    financiamientoDetalle: data.datosGenerales.financiamientoDetalle || undefined,

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
 * Consulta la lista de expedientes registrados en PostgreSQL para el usuario autenticado.
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
 * Consulta el detalle de un expediente por su ID.
 */
export async function obtenerExpediente(id: string): Promise<any> {
  return await apiClient.get(`/api/v1/expedientes/${id}`);
}
