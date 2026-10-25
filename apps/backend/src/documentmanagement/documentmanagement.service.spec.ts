import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { DocumentManagementService } from './documentmanagement.service.js';
import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard.js';

describe('DocumentManagementService', () => {
  let service: DocumentManagementService;
  let prismaMock: any;

  const mockSolicitanteUser: AuthenticatedUser = {
    id: 'usr-sol-1',
    email: 'solicitante@estancia.pe',
    nombre: 'Juan Solicitante',
    roles: ['SOLICITANTE'],
  };

  const mockEvaluadorUser: AuthenticatedUser = {
    id: 'usr-eval-1',
    email: 'evaluador@estancia.pe',
    nombre: 'Carlos Evaluador',
    roles: ['PRESIDENTE_CEI'],
  };

  beforeEach(() => {
    prismaMock = {
      $transaction: vi.fn(async (cb) => cb(prismaMock)),
      ticket: {
        findFirst: vi.fn(),
      },
      ticketDocumento: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'doc-1', ...data })),
        update: vi.fn(),
      },
      usuario: {
        findUnique: vi.fn(),
      },
    };

    service = new DocumentManagementService(prismaMock);
  });

  describe('Validación de archivos ZIP para rol Solicitante en Asunto del Pedido', () => {
    it('debe permitir subir un archivo .zip a un solicitante para la sección Asunto del Pedido', async () => {
      prismaMock.ticket.findFirst.mockResolvedValue({
        id: 'tck-1',
        estado: 'BORRADOR',
      });

      const file = {
        originalname: 'anexos_estudio.zip',
        mimetype: 'application/zip',
        size: 5 * 1024 * 1024, // 5 MB
        buffer: Buffer.from('fake-zip-data'),
      };

      const result = await service.uploadTicketDocument(
        'tck-1',
        file,
        'ANEXO_ASUNTO_1',
        mockSolicitanteUser,
      );

      expect(result).toBeDefined();
      expect(result.tipoDocumental).toBe('ANEXO_ASUNTO_1');
      expect(result.mimeType).toBe('application/zip');
      expect(prismaMock.ticketDocumento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombreOriginal: 'anexos_estudio.zip',
            mimeType: 'application/zip',
            tamanioBytes: 5 * 1024 * 1024,
          }),
        }),
      );
    });

    it('debe rechazar archivo .zip si excede el límite máximo de 10 MB', async () => {
      const file = {
        originalname: 'archivo_pesado.zip',
        mimetype: 'application/zip',
        size: 11 * 1024 * 1024, // 11 MB > 10 MB
        buffer: Buffer.from('heavy-zip-data'),
      };

      await expect(
        service.uploadTicketDocument(
          'tck-1',
          file,
          'ANEXO_ASUNTO_1',
          mockSolicitanteUser,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.uploadTicketDocument(
          'tck-1',
          file,
          'ANEXO_ASUNTO_1',
          mockSolicitanteUser,
        ),
      ).rejects.toThrow(/supera el tamaño máximo permitido de 10 MB/);
    });

    it('debe rechazar un archivo .zip si el usuario no tiene el rol de Solicitante', async () => {
      const file = {
        originalname: 'anexo.zip',
        mimetype: 'application/zip',
        size: 2 * 1024 * 1024,
        buffer: Buffer.from('zip-content'),
      };

      await expect(
        service.uploadTicketDocument(
          'tck-1',
          file,
          'ANEXO_ASUNTO_1',
          mockEvaluadorUser,
        ),
      ).rejects.toThrow('Los archivos comprimidos ZIP están reservados exclusivamente para el rol de Solicitante.');
    });

    it('debe rechazar un archivo .zip si el tipo documental no pertenece a la sección Asunto del Pedido', async () => {
      const file = {
        originalname: 'proyecto.zip',
        mimetype: 'application/zip',
        size: 2 * 1024 * 1024,
        buffer: Buffer.from('zip-content'),
      };

      await expect(
        service.uploadTicketDocument(
          'tck-1',
          file,
          'PLAN_PROYECTO',
          mockSolicitanteUser,
        ),
      ).rejects.toThrow(/solo están permitidos en los anexos de la sección Asunto del Pedido/);
    });

    it('debe rechazar archivos ejecutables prohibidos como .exe', async () => {
      const file = {
        originalname: 'malware.exe',
        mimetype: 'application/octet-stream',
        size: 1024,
        buffer: Buffer.from('malware'),
      };

      await expect(
        service.uploadTicketDocument(
          'tck-1',
          file,
          'ANEXO_ASUNTO_1',
          mockSolicitanteUser,
        ),
      ).rejects.toThrow(/no está permitido por motivos de seguridad/);
    });
  });

  describe('Acceso y descarga por otros roles (CEI: Presidente, Vocal, Secretaría)', () => {
    it('debe permitir a un miembro del CEI descargar el archivo ZIP creado por el solicitante una vez registrado el trámite', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);

      prismaMock.ticketDocumento.findUnique = vi.fn().mockResolvedValue({
        id: 'doc-zip-1',
        ticketId: 'tck-1',
        nombreOriginal: 'expediente_completo.zip',
        nombreArchivo: '123_abc.zip',
        tipoDocumental: 'ANEXO_ASUNTO_1',
        mimeType: 'application/zip',
        storagePath: 'uploads/documents/123_abc.zip',
        ticket: {
          solicitanteId: 'usr-sol-1',
          estado: 'REGISTRADO',
        },
      });

      const docInfo = await service.getDocumentForDownload('doc-zip-1', mockEvaluadorUser);

      expect(docInfo).toBeDefined();
      expect(docInfo.nombreOriginal).toBe('expediente_completo.zip');
      expect(docInfo.mimeType).toBe('application/zip');
      expect(docInfo.filePath).toContain('123_abc.zip');
    });
  });
});
