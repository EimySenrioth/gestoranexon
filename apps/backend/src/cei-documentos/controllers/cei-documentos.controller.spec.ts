import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CeiDocumentosController } from './cei-documentos.controller.js';
import { NotFoundException } from '@nestjs/common';

describe('CeiDocumentosController', () => {
  let controller: CeiDocumentosController;
  let resolverServiceMock: any;
  let generarAnexo9PdfUseCaseMock: any;
  let prismaMock: any;
  let resMock: any;

  beforeEach(() => {
    resolverServiceMock = {
      obtenerDocumento: vi.fn(),
    };
    generarAnexo9PdfUseCaseMock = {
      ejecutar: vi.fn(),
    };
    prismaMock = {
      expediente: {
        findUnique: vi.fn(),
      },
    };

    resMock = {
      set: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    controller = new CeiDocumentosController(
      resolverServiceMock,
      generarAnexo9PdfUseCaseMock,
      prismaMock,
    );
  });

  it('debe arrojar NotFoundException si no existe el documento ni cumple condiciones de generación', async () => {
    resolverServiceMock.obtenerDocumento.mockResolvedValue({
      expedienteId: 'exp_inexistente',
      documento: null,
    });
    prismaMock.expediente.findUnique.mockResolvedValue({
      id: 'exp_inexistente',
      evaluaciones: [{}, {}], // Solo 2 evaluaciones
    });

    await expect(
      controller.entregarAnexo9('EXP-2026-9999', 'false', 'latest', 'pdf', resMock),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe retornar JSON cuando format=json y el documento existe', async () => {
    const mockDoc = {
      id: 'doc_123',
      expedienteId: 'exp_1',
      codigoExpediente: 'EXP-2026-0001',
      codigoTicket: 'TCK-2026-0001',
      sesionVotacionId: 'ses_1',
      tipoDocumento: 'ANEXO_9',
      estado: 'VIGENTE',
      dictamenFinal: 'APROBADO',
      nombreArchivo: 'Anexo9_EXP-2026-0001_v1.pdf',
      mimeType: 'application/pdf',
      tamanioBytes: 245000,
      totalPaginas: 2,
      hashSha256: 'a'.repeat(64),
      version: 1,
      urlPublica: '/api/cei/documentos/anexo-9/EXP-2026-0001',
      creadoEn: new Date('2026-11-06T12:00:00Z'),
      firmantesSnapshot: [],
      storagePath: '/fake/path/Anexo9_EXP-2026-0001_v1.pdf',
    };

    resolverServiceMock.obtenerDocumento.mockResolvedValue({
      expedienteId: 'exp_1',
      documento: mockDoc,
    });

    await controller.entregarAnexo9(
      'EXP-2026-0001',
      'false',
      'latest',
      'json',
      resMock,
    );

    expect(resMock.status).toHaveBeenCalledWith(200);
    expect(resMock.json).toHaveBeenCalledWith(
      expect.objectContaining({
        documentoId: 'doc_123',
        codigoExpediente: 'EXP-2026-0001',
        totalPaginas: 2,
      }),
    );
  });
});
