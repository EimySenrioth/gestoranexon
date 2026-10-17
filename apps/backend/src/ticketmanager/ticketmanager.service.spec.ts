import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TicketManagerService,
  DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS,
} from './ticketmanager.service.js';
import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

describe('TicketManagerService', () => {
  let service: TicketManagerService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      $transaction: vi.fn(async (cb) => cb(prismaMock)),
      $queryRaw: vi.fn(),
      ticket: {
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      ticketHistorial: {
        create: vi.fn(),
      },
      ticketDocumento: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      expediente: {
        create: vi.fn(),
      },
      documento: {
        createMany: vi.fn(),
      },
    };

    service = new TicketManagerService(prismaMock);
  });

  describe('submit', () => {
    it('debe rechazar con 404 si la solicitud no existe', async () => {
      prismaMock.ticket.findFirst.mockResolvedValue(null);

      await expect(service.submit('tck-123', 'usr-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe rechazar con 409 si la solicitud no está en BORRADOR', async () => {
      prismaMock.ticket.findFirst.mockResolvedValue({
        id: 'tck-123',
        estado: 'EXPEDIENTE_GENERADO',
        titulo: 'Proyecto de prueba',
        codigoSolicitante: null,
        actualizadoEn: new Date(),
      });

      await expect(service.submit('tck-123', 'usr-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe proteger contra doble clic cuando updateMany retorna count === 0', async () => {
      prismaMock.ticket.findFirst.mockResolvedValue({
        id: 'tck-123',
        estado: 'BORRADOR',
        titulo: 'Proyecto de prueba',
        codigoSolicitante: null,
        actualizadoEn: new Date(),
      });
      // Simulamos que otro request ya cambió el estado
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.submit('tck-123', 'usr-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe rechazar con 422 si faltan los 4 documentos obligatorios del expediente', async () => {
      const fecha = new Date();
      prismaMock.ticket.findFirst.mockResolvedValue({
        id: 'tck-123',
        estado: 'BORRADOR',
        titulo: 'Proyecto con titulo valido de más de 5 caracteres',
        codigoSolicitante: null,
        actualizadoEn: fecha,
      });
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.ticket.findUniqueOrThrow.mockResolvedValue({
        id: 'tck-123',
        titulo: 'Proyecto con titulo valido de más de 5 caracteres',
        financiamiento: 'Autofinanciado',
        financiamientoDetalle: null,
        tipoInvestigacion: 'Tesis de pregrado',
        tipoInvestigacionOtro: null,
        // Solo tiene 2 de los 4 documentos requeridos
        documentos: [
          { tipoDocumental: 'NATURALEZA_PROYECTO' },
          { tipoDocumental: 'PARTICIPANTES' },
        ],
        tipoTramite: null,
      });

      try {
        await service.submit('tck-123', 'usr-1');
        expect.unreachable('Debe lanzar UnprocessableEntityException');
      } catch (err: any) {
        expect(err).toBeInstanceOf(UnprocessableEntityException);
        const response = err.getResponse();
        expect(response.requisitosFaltantes).toContain('MODALIDAD');
        expect(response.requisitosFaltantes).toContain('PLAN_PROYECTO');
      }
    });

    it('debe culminar exitosamente creando el Expediente y copiando los 4 documentos vigentes', async () => {
      const fecha = new Date();
      prismaMock.ticket.findFirst.mockResolvedValue({
        id: 'tck-123',
        estado: 'BORRADOR',
        titulo: 'Proyecto con titulo valido de más de 5 caracteres',
        codigoSolicitante: 'EXP-001',
        actualizadoEn: fecha,
      });
      // Primer updateMany (submit -> REGISTRADO)
      prismaMock.ticket.updateMany
        .mockResolvedValueOnce({ count: 1 })
        // Segundo updateMany (generarExpediente: REGISTRADO -> EXPEDIENTE_GENERADO)
        .mockResolvedValueOnce({ count: 1 });

      prismaMock.ticket.findUniqueOrThrow.mockResolvedValue({
        id: 'tck-123',
        titulo: 'Proyecto con titulo valido de más de 5 caracteres',
        financiamiento: 'Autofinanciado',
        financiamientoDetalle: null,
        tipoInvestigacion: 'Tesis de pregrado',
        tipoInvestigacionOtro: null,
        documentos: DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS.map((tipo) => ({
          tipoDocumental: tipo,
        })),
        tipoTramite: null,
      });

      prismaMock.$queryRaw.mockResolvedValue([{ ultimo: 1 }]);
      prismaMock.expediente.create.mockResolvedValue({
        id: 'exp-uuid',
        codigo: 'EXP-2026-0001',
        estado: 'INICIADO',
      });
      prismaMock.ticketDocumento.findMany.mockResolvedValue(
        DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS.map((tipo, idx) => ({
          id: `doc-${idx}`,
          nombreOriginal: `${tipo}.pdf`,
          tipoDocumental: tipo,
          storagePath: `/uploads/${tipo}.pdf`,
        })),
      );

      const result = await service.submit('tck-123', 'usr-1');

      expect(result.codigo).toBe('EXP-2026-0001');
      expect(prismaMock.expediente.create).toHaveBeenCalledWith({
        data: {
          codigo: 'EXP-2026-0001',
          estado: 'INICIADO',
        },
      });
      expect(prismaMock.ticket.update).toHaveBeenCalledWith({
        where: { id: 'tck-123' },
        data: { expedienteId: 'exp-uuid' },
      });
      expect(prismaMock.documento.createMany).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('debe permitir cancelar si el ticket está en BORRADOR', async () => {
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });

      const res = await service.cancel('tck-123', 'usr-1');
      expect(res.estado).toBe('CANCELADO');
      expect(prismaMock.ticketHistorial.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accion: 'CANCEL' }),
        }),
      );
    });

    it('debe rechazar con 409 si el ticket ya no está en BORRADOR', async () => {
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.ticket.findFirst.mockResolvedValue({ estado: 'EXPEDIENTE_GENERADO' });

      await expect(service.cancel('tck-123', 'usr-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('callbackEvaluacion', () => {
    it('debe ser idempotente si ya se había registrado la evaluación', async () => {
      prismaMock.ticket.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.ticket.findUnique.mockResolvedValue({
        id: 'tck-123',
        estado: 'EXPEDIENTE_GENERADO',
        resultadoEvaluacionExterna: 'APROBADO',
      });

      const res = await service.callbackEvaluacion('tck-123', {
        resultado: 'APROBADO',
      });
      expect(res.resultado).toBe('APROBADO');
      expect(res.mensaje).toContain('previamente');
    });
  });
});
