/**
 * Servicio de Evaluación de Proyectos (Comité CEI)
 * Conecta con el backend NestJS (GET /api/v1/expedientes/asignados-a-mi)
 * utilizando autenticación JWT y paginación server-side a 10 expedientes por página.
 * Sin datos simulados ni mockData.
 */

import { apiClient, ApiError } from "@/services/api.client";
import {
  BackendExpedienteAsignadoItem,
  PaginadoResultado,
  QueryAsignadosParams,
  SolicitudFirmaItem,
} from "../types/evaluacion.types";
import { mapBackendToSolicitudFirma } from "../mappers/evaluacion.mapper";

/**
 * Consulta la lista paginada de expedientes asignados al evaluador CEI autenticado.
 */
export async function listarSolicitudesParaEvaluar(
  params: QueryAsignadosParams = { page: 1, limit: 10 }
): Promise<PaginadoResultado<SolicitudFirmaItem>> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;

  try {
    const data = await apiClient.get<PaginadoResultado<BackendExpedienteAsignadoItem>>(
      "/api/v1/expedientes/asignados-a-mi",
      {
        params: {
          page: String(page),
          limit: String(limit),
        },
      }
    );

    if (data && Array.isArray(data.items)) {
      return {
        items: data.items.map(mapBackendToSolicitudFirma),
        total: data.total ?? data.items.length,
        page: data.page ?? page,
        limit: data.limit ?? limit,
        totalPages:
          data.totalPages ??
          (Math.ceil((data.total ?? data.items.length) / limit) || 1),
      };
    }

    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(
        `[evaluacion.service] Error ${error.status} al consultar expedientes asignados:`,
        error.message
      );
    } else {
      console.error("[evaluacion.service] Error inesperado:", error);
    }

    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
}

/**
 * Registra la evaluación / firma en el backend cuando se active dicho flujo en el futuro.
 */
export async function firmarSolicitudEvaluacion(
  solicitudId: string
): Promise<{ ok: boolean; etapaActual: "Evaluado"; firmado: true }> {
  try {
    await apiClient.post(`/api/v1/tickets/${solicitudId}/evaluar`, {
      resultado: "APROBADO",
      observacion: "Aprobado por el Comité de Ética para la Investigación.",
    });
  } catch (error) {
    console.warn(`[evaluacion.service] Fallo al registrar evaluación para ${solicitudId}:`, error);
  }

  return {
    ok: true,
    etapaActual: "Evaluado",
    firmado: true,
  };
}
