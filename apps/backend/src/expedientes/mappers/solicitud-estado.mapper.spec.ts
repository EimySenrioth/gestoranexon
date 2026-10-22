import { describe, it, expect } from 'vitest';
import { EstadoExpediente, EstadoTicket } from '@prisma/client';
import { mapTicketToSolicitudFila } from './solicitud-estado.mapper.js';

describe('solicitud-estado.mapper', () => {
  const baseFecha = new Date('2026-10-22T10:00:00Z');

  it('debe mapear INICIADO a recibido, En espera, finalizado=false', () => {
    const row = {
      id: 'tck_1',
      codigo: 'TCK-2026-0001',
      estado: EstadoTicket.EXPEDIENTE_GENERADO,
      creadoEn: baseFecha,
      expediente: {
        codigo: 'EXP-2026-0001',
        estado: EstadoExpediente.INICIADO,
      },
    };

    const result = mapTicketToSolicitudFila(row);

    expect(result.id).toBe('EXP-2026-0001');
    expect(result.ticketId).toBe('tck_1');
    expect(result.finalizado).toBe(false);
    expect(result.evaluacion).toBe('En espera');
    expect(result.progreso).toBe('recibido');
  });

  it('debe mapear DOCUMENTACION_PENDIENTE u OBSERVADO a observado por forma, Observada', () => {
    const row = {
      id: 'tck_2',
      codigo: 'TCK-2026-0002',
      estado: EstadoTicket.OBSERVADO,
      creadoEn: baseFecha,
      expediente: {
        codigo: 'EXP-2026-0002',
        estado: EstadoExpediente.DOCUMENTACION_PENDIENTE,
      },
    };

    const result = mapTicketToSolicitudFila(row);

    expect(result.finalizado).toBe(false);
    expect(result.evaluacion).toBe('Observada');
    expect(result.progreso).toBe('observado por forma');
  });

  it('debe mapear EN_EVALUACION a en evaluación, En revisión, finalizado=false', () => {
    const row = {
      id: 'tck_3',
      codigo: 'TCK-2026-0003',
      estado: EstadoTicket.EXPEDIENTE_GENERADO,
      creadoEn: baseFecha,
      expediente: {
        codigo: 'EXP-2026-0003',
        estado: EstadoExpediente.EN_EVALUACION,
      },
    };

    const result = mapTicketToSolicitudFila(row);

    expect(result.finalizado).toBe(false);
    expect(result.evaluacion).toBe('En revisión');
    expect(result.progreso).toBe('en evaluación');
  });

  it('debe mapear APROBADO a dictaminado, Aprobada, finalizado=true', () => {
    const row = {
      id: 'tck_4',
      codigo: 'TCK-2026-0004',
      estado: EstadoTicket.EXPEDIENTE_GENERADO,
      creadoEn: baseFecha,
      resultadoEvaluacionExterna: 'APROBADO',
      expediente: {
        codigo: 'EXP-2026-0004',
        estado: EstadoExpediente.APROBADO,
      },
    };

    const result = mapTicketToSolicitudFila(row);

    expect(result.finalizado).toBe(true);
    expect(result.evaluacion).toBe('Aprobada');
    expect(result.progreso).toBe('dictaminado');
  });

  it('debe mapear APROBADO con observaciones a dictaminado, Observada, finalizado=true', () => {
    const row = {
      id: 'tck_5',
      codigo: 'TCK-2026-0005',
      estado: EstadoTicket.EXPEDIENTE_GENERADO,
      creadoEn: baseFecha,
      resultadoEvaluacionExterna: 'APROBADO_CON_OBSERVACIONES',
      expediente: {
        codigo: 'EXP-2026-0005',
        estado: EstadoExpediente.APROBADO,
      },
    };

    const result = mapTicketToSolicitudFila(row);

    expect(result.finalizado).toBe(true);
    expect(result.evaluacion).toBe('Observada');
    expect(result.progreso).toBe('dictaminado');
  });

  it('debe caer en Pendiente si el estado es desconocido o sin expediente', () => {
    const row = {
      id: 'tck_6',
      codigo: 'TCK-2026-0006',
      estado: EstadoTicket.BORRADOR,
      creadoEn: baseFecha,
      expediente: null,
    };

    const result = mapTicketToSolicitudFila(row);

    expect(result.id).toBe('TCK-2026-0006');
    expect(result.finalizado).toBe(false);
    expect(result.evaluacion).toBe('Pendiente');
    expect(result.progreso).toBe('pendiente');
  });
});
