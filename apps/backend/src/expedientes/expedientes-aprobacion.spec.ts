import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpedientesService } from './expedientes.service.js';
import { ExpedienteNoEncontradoException } from '../common/errors/index.js';
import { BadRequestException } from '@nestjs/common';

describe('ExpedientesService - Aprobación y Dictamen de Presidencia (5 Calificaciones)', () => {
  let service: ExpedientesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      expediente: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      ticket: {
        update: vi.fn(),
      },
      ticketHistorial: {
        create: vi.fn(),
      },
      sesionVotacion: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      historial: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (cb) => {
        if (typeof cb === 'function') {
          return await cb(mockPrisma);
        }
        return cb;
      }),
    };

    service = new ExpedientesService(mockPrisma);
  });

  it('debe lanzar ExpedienteNoEncontradoException si el expediente no existe', async () => {
    mockPrisma.expediente.findFirst.mockResolvedValue(null);

    await expect(
      service.aprobarPorPresidencia('exp-inexistente', 'pres-1', {}),
    ).rejects.toThrow(ExpedienteNoEncontradoException);
  });

  it('debe rechazar con BadRequestException si tiene menos de 5 calificaciones', async () => {
    mockPrisma.expediente.findFirst.mockResolvedValue({
      id: 'exp-1',
      codigo: 'EXP-2026-00001',
      ticket: { id: 'tck-1' },
      evaluaciones: [
        { id: 'ev-1', resultado: 'APROBADO' },
        { id: 'ev-2', resultado: 'APROBADO' },
        { id: 'ev-3', resultado: 'APROBADO_CON_OBSERVACIONES' },
        { id: 'ev-4', resultado: 'APROBADO' },
        { id: 'ev-5', resultado: null }, // Aún no calificado
      ],
    });

    await expect(
      service.aprobarPorPresidencia('exp-1', 'pres-1', {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe aprobar el expediente y ticket transaccionalmente si tiene las 5 calificaciones completadas', async () => {
    const mockExpediente = {
      id: 'exp-1',
      codigo: 'EXP-2026-00001',
      solicitudId: 'sol-1',
      ticket: {
        id: 'tck-1',
        estado: 'EXPEDIENTE_GENERADO',
      },
      evaluaciones: [
        { id: 'ev-1', resultado: 'APROBADO' },
        { id: 'ev-2', resultado: 'APROBADO' },
        { id: 'ev-3', resultado: 'APROBADO' },
        { id: 'ev-4', resultado: 'APROBADO' },
        { id: 'ev-5', resultado: 'APROBADO' },
      ],
    };

    mockPrisma.expediente.findFirst.mockResolvedValue(mockExpediente);
    mockPrisma.expediente.update.mockResolvedValue({
      id: 'exp-1',
      estado: 'APROBADO',
    });
    mockPrisma.ticket.update.mockResolvedValue({
      id: 'tck-1',
      resultadoEvaluacionExterna: 'APROBADO',
    });
    mockPrisma.sesionVotacion.findFirst.mockResolvedValue({
      id: 'sesion-1',
      expedienteId: 'exp-1',
      documentoJson: {},
    });

    const resultado = await service.aprobarPorPresidencia('exp-1', 'pres-1', {
      observaciones: 'Resolución de conformidad emitida por Presidencia.',
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.estado).toBe('APROBADO');
    expect(resultado.resultadoEvaluacion).toBe('APROBADO');

    // Verificar llamadas a base de datos dentro de la transacción
    expect(mockPrisma.expediente.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'exp-1' },
        data: { estado: 'APROBADO' },
      }),
    );

    expect(mockPrisma.ticket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tck-1' },
        data: expect.objectContaining({
          resultadoEvaluacionExterna: 'APROBADO',
        }),
      }),
    );

    expect(mockPrisma.ticketHistorial.create).toHaveBeenCalled();
    expect(mockPrisma.historial.create).toHaveBeenCalled();
  });
});

