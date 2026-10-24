import {
  BackendExpedienteAsignadoItem,
  EtapaEvaluacion,
  SolicitudFirmaItem,
} from "../types/evaluacion.types";

/**
 * Formatea una fecha ISO a representación local legible D/M/YYYY
 */
function formatearFecha(fechaStr?: string | null): string {
  if (!fechaStr) return "-";
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return "-";
    return fecha.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Mapea la respuesta del backend (Ticket + Expediente + Evaluaciones)
 * al formato SolicitudFirmaItem de la tabla de solicitudes a firmar.
 */
export function mapBackendToSolicitudFirma(
  item: BackendExpedienteAsignadoItem
): SolicitudFirmaItem {
  const codigoVisible = item.expediente?.codigo || item.codigo;
  const evaluacionMiembro = item.expediente?.evaluaciones?.[0];

  // La evaluación se considera concluida si el miembro ya registró resultado o el expediente fue dictaminado
  const tieneResultadoEvaluacion = Boolean(evaluacionMiembro?.resultado);
  const estadoExpediente = item.expediente?.estado;
  const estadoTicket = item.estado;

  const isEvaluado =
    tieneResultadoEvaluacion ||
    estadoExpediente === "APROBADO" ||
    estadoExpediente === "RECHAZADO" ||
    estadoExpediente === "CERRADO" ||
    estadoTicket === "APROBADA" ||
    estadoTicket === "ARCHIVADO";

  // Fecha de Solicitud (fechaPresentacion o creadoEn)
  const fechaSolicitud = formatearFecha(
    item.fechaPresentacion || item.creadoEn
  );

  // Fecha de Evaluación: REGLA ESTRICTA
  // "la fecha de evaluacion solo se actualiza cuando se termina la evaluacion"
  let fechaEvaluacion = "-";
  if (isEvaluado) {
    fechaEvaluacion = formatearFecha(
      evaluacionMiembro?.actualizadoEn || item.actualizadoEn || item.creadoEn
    );
  }

  // Etapa Actual
  let etapaActual: EtapaEvaluacion = "En evaluación";
  if (isEvaluado) {
    etapaActual = "Evaluado";
  } else if (
    estadoExpediente === "OBSERVADO" ||
    estadoTicket === "OBSERVADO" ||
    estadoExpediente === "DOCUMENTACION_PENDIENTE"
  ) {
    etapaActual = "Observado";
  } else if (estadoExpediente === "INICIADO" && !tieneResultadoEvaluacion) {
    etapaActual = "Iniciado";
  } else {
    etapaActual = "En evaluación";
  }

  return {
    id: codigoVisible,
    ticketId: item.id,
    titulo: item.titulo,
    fechaSolicitud,
    fechaEvaluacion,
    etapaActual,
    evaluar: {
      firmado: isEvaluado,
      fechaFirma: isEvaluado ? fechaEvaluacion : undefined,
    },
  };
}
