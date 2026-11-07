import { describe, it, expect, beforeEach } from 'vitest';
import { PdfValidatorService } from './pdf-validator.service.js';
import { BadRequestException } from '@nestjs/common';

describe('PdfValidatorService', () => {
  let service: PdfValidatorService;

  beforeEach(() => {
    service = new PdfValidatorService();
  });

  it('debe arrojar error si el buffer está vacío o es nulo', () => {
    expect(() => service.validarBuffer(Buffer.alloc(0))).toThrow(
      BadRequestException,
    );
  });

  it('debe arrojar error si el tamaño es menor al mínimo de 10 KB', () => {
    const dummyBuffer = Buffer.from('%PDF-1.4 dummy short content');
    expect(() => service.validarBuffer(dummyBuffer)).toThrow(
      BadRequestException,
    );
  });

  it('debe arrojar error si no contiene la cabecera estándar %PDF-', () => {
    const invalidBuffer = Buffer.alloc(15 * 1024, 0x41); // 15 KB de 'A'
    expect(() => service.validarBuffer(invalidBuffer)).toThrow(
      /no cuenta con la firma binaria estándar/,
    );
  });

  it('debe validar y calcular hash SHA-256 correctamente para un PDF válido simulado', () => {
    const header = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\n');
    const padding = Buffer.alloc(12 * 1024, 0x20); // 12 KB padding
    const validPdfBuffer = Buffer.concat([header, padding]);

    const resultado = service.validarBuffer(validPdfBuffer);

    expect(resultado.esValido).toBe(true);
    expect(resultado.totalPaginas).toBeGreaterThanOrEqual(1);
    expect(resultado.hashSha256).toHaveLength(64);
    expect(resultado.tamanioBytes).toBe(validPdfBuffer.length);
  });
});

