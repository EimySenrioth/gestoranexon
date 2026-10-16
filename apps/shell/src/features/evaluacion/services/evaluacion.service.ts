/**
 * Servicio de Evaluación de Proyectos (Comité CEI)
 * Conecta con el backend NestJS (/api/v1/tickets) y provee fallback automático a mock data.
 */

import { apiClient, ApiError } from "@/services/api.client";
import { SolicitudFirmaItem } from "../types/evaluacion.types";
import { MOCK_SOLICITUDES_FIRMA } from "../mocks/mockData";

export async function listarSolicitudesParaEvaluar(): Promise<SolicitudFirmaItem[]> {
  try {
    const data = await apiClient.get<any[]>("/api/v1/tickets");
    if (Array.isArray(data) && data.length > 0) {
      return data.map((t: any) => ({
        id: t.codigo || t.id,
        fechaSolicitud: t.creadoEn ? new Date(t.creadoEn).toLocaleDateString() : "9/26/2026",
        fechaEvaluacion: t.actualizadoEn ? new Date(t.actualizadoEn).toLocaleDateString() : "9/26/2026",
        etapaActual: t.estado === "APROBADA" || t.estado === "ADMITIDO" ? "Evaluado" : "En evaluación",
        evaluar: {
          firmado: t.estado === "APROBADA",
          fechaFirma: t.estado === "APROBADA" ? new Date().toLocaleDateString() : undefined,
        },
      }));
    }
    return MOCK_SOLICITUDES_FIRMA;
  } catch (error) {
    console.warn("[evaluacion.service] Backend no disponible o tabla vacía. Usando datos de respaldo.");
    return MOCK_SOLICITUDES_FIRMA;
  }
}

export async function firmarSolicitudEvaluacion(
  solicitudId: string
): Promise<{ ok: boolean; etapaActual: "Evaluado"; firmado: true }> {
  try {
    // Intentar registrar la evaluación en el backend
    await apiClient.post(`/api/v1/tickets/${solicitudId}/evaluar`, {
      resultado: "APROBADO",
      observacion: "Aprobado por el Comité de Ética para la Investigación.",
    });
  } catch (error) {
    console.warn(`[evaluacion.service] Fallback local para firma de solicitud ${solicitudId}.`);
  }

  return {
    ok: true,
    etapaActual: "Evaluado",
    firmado: true,
  };
}
