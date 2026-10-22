import { EstadoExpediente, EstadoTicket } from '@prisma/client';
import {
  EvaluacionEstado,
  ProgresoEstado,
  SolicitudFilaDto,
} from '../dto/solicitud-fila.dto.js';

export interface TicketConExpedienteRow {
  id: string;
  codigo: string;
  estado: EstadoTicket;
  creadoEn: Date;
  resultadoEvaluacionExterna?: string | null;
  expediente?: {
    codigo: string;
    estado: EstadoExpediente;
  } | null;
}

export function mapTicketToSolicitudFila(row: TicketConExpedienteRow): SolicitudFilaDto {
  const codigoVisible = row.expediente?.codigo || row.codigo;
  const fechaIso = row.creadoEn ? row.creadoEn.toISOString() : new Date().toISOString();

  let finalizado = false;
  let evaluacion: EvaluacionEstado = 'Pendiente';
  let progreso: ProgresoEstado = 'pendiente';

  const estadoExpediente = row.expediente?.estado;
  const estadoTicket = row.estado;

  if (estadoExpediente === EstadoExpediente.INICIADO) {
    progreso = 'recibido';
    evaluacion = 'En espera';
    finalizado = false;
  } else if (
    estadoExpediente === EstadoExpediente.DOCUMENTACION_PENDIENTE ||
    estadoTicket === EstadoTicket.OBSERVADO
  ) {
    progreso = 'observado por forma';
    evaluacion = 'Observada';
    finalizado = false;
  } else if (estadoExpediente === EstadoExpediente.EN_EVALUACION) {
    progreso = 'en evaluación';
    evaluacion = 'En revisión';
    finalizado = false;
  } else if (estadoExpediente === EstadoExpediente.APROBADO) {
    progreso = 'dictaminado';
    evaluacion =
      row.resultadoEvaluacionExterna === 'APROBADO_CON_OBSERVACIONES'
        ? 'Observada'
        : 'Aprobada';
    finalizado = true;
  } else if (
    estadoExpediente === EstadoExpediente.RECHAZADO ||
    estadoTicket === EstadoTicket.RECHAZADO
  ) {
    progreso = 'dictaminado';
    evaluacion = 'Rechazada';
    finalizado = true;
  } else if (
    estadoExpediente === EstadoExpediente.CERRADO ||
    estadoTicket === EstadoTicket.ARCHIVADO
  ) {
    progreso = 'archivado';
    if (row.resultadoEvaluacionExterna === 'APROBADO') {
      evaluacion = 'Aprobada';
    } else if (row.resultadoEvaluacionExterna === 'APROBADO_CON_OBSERVACIONES') {
      evaluacion = 'Observada';
    } else {
      evaluacion = 'Entregada';
    }
    finalizado = true;
  } else {
    // Casos no definidos o estados futuros aún no utilizados caen en Pendiente
    progreso = 'pendiente';
    evaluacion = 'Pendiente';
    finalizado = false;
  }

  return {
    id: codigoVisible,
    ticketId: row.id,
    fecha: fechaIso,
    finalizado,
    evaluacion,
    progreso,
  };
}
