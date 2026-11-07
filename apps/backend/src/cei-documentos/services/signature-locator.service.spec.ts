import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignatureLocatorService } from './signature-locator.service.js';
import type { PrismaService } from '../../database/prisma.service.js';

describe('SignatureLocatorService', () => {
  let service: SignatureLocatorService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      evaluacion: {
        findMany: vi.fn(),
      },
    };
    service = new SignatureLocatorService(prismaMock as unknown as PrismaService);
  });

  describe('validarMagicNumbers', () => {
    it('debe validar exitosamente un PNG Base64 genuino (89 50 4E 47)', () => {
      // 89 50 4E 47 0D 0A 1A 0A
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const dataUrl = `data:image/png;base64,${pngHeader.toString('base64')}`;

      expect(service.validarMagicNumbers(dataUrl)).toBe(true);
    });

    it('debe validar exitosamente un JPEG Base64 genuino (FF D8 FF)', () => {
      // FF D8 FF E0 00 10 4A 46
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const dataUrl = `data:image/jpeg;base64,${jpegHeader.toString('base64')}`;

      expect(service.validarMagicNumbers(dataUrl)).toBe(true);
    });

    it('debe rechazar archivos que no sean imágenes o tengan formato incorrecto', () => {
      const invalidDataUrl = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
      expect(service.validarMagicNumbers(invalidDataUrl)).toBe(false);
    });
  });

  describe('localizarYValidarFirmas', () => {
    it('debe arrojar BadRequestException si hay menos de 5 evaluaciones', async () => {
      prismaMock.evaluacion.findMany.mockResolvedValue([
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ]);

      await expect(service.localizarYValidarFirmas('exp_1')).rejects.toThrow(
        /cuenta con 3 de las 5 evaluaciones requeridas/,
      );
    });

    it('debe arrojar BadRequestException si algún evaluador no tiene firma registrada', async () => {
      prismaMock.evaluacion.findMany.mockResolvedValue([
        {
          id: '1',
          evaluador: { id: 'u1', nombre: 'Ricardo', apellido: 'Palma', roles: [] },
          firmas: [], // Falta firma
        },
        {
          id: '2',
          evaluador: { id: 'u2', nombre: 'Rosa', apellido: 'Alva', roles: [] },
          firmas: [{ firma: 'data:image/png;base64,fake' }],
        },
        {
          id: '3',
          evaluador: { id: 'u3', nombre: 'Andres', apellido: 'Salazar', roles: [] },
          firmas: [{ firma: 'data:image/png;base64,fake' }],
        },
        {
          id: '4',
          evaluador: { id: 'u4', nombre: 'Patricia', apellido: 'Vega', roles: [] },
          firmas: [{ firma: 'data:image/png;base64,fake' }],
        },
        {
          id: '5',
          evaluador: { id: 'u5', nombre: 'Javier', apellido: 'Morales', roles: [] },
          firmas: [{ firma: 'data:image/png;base64,fake' }],
        },
      ]);

      await expect(service.localizarYValidarFirmas('exp_1')).rejects.toThrow(
        /Falta la firma digital reglamentaria para el evaluador Ricardo Palma/,
      );
    });
  });
});
