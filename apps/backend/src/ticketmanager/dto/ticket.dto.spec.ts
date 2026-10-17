import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateTicketDto,
  UpdateTicketDto,
  TIPOS_INVESTIGACION,
  TIPOS_FINANCIAMIENTO,
} from './create-ticket.dto.js';
import {
  calcularClaveDuplicidad,
  formatearCorrelativo,
  normalizarCondicionales,
} from '../ticketmanager.service.js';

describe('Ticket DTOs and Validation Rules', () => {
  it('debe rechazar un título con menos de 5 caracteres', async () => {
    const dto = plainToInstance(CreateTicketDto, {
      titulo: 'ABCD',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'titulo')).toBe(true);
  });

  it('debe aceptar un título válido y aplicar trim', async () => {
    const dto = plainToInstance(CreateTicketDto, {
      titulo: '  Proyecto de Investigación Biológica en Perú  ',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'titulo')).toBe(false);
    expect(dto.titulo).toBe('Proyecto de Investigación Biológica en Perú');
  });

  it('debe exigir tipoInvestigacionOtro cuando tipoInvestigacion es Otro', async () => {
    const dtoInvalido = plainToInstance(CreateTicketDto, {
      titulo: 'Proyecto Valido 2026',
      tipoInvestigacion: 'Otro',
    });
    const errors = await validate(dtoInvalido);
    expect(errors.some((e) => e.property === 'tipoInvestigacionOtro')).toBe(true);

    const dtoValido = plainToInstance(CreateTicketDto, {
      titulo: 'Proyecto Valido 2026',
      tipoInvestigacion: 'Otro',
      tipoInvestigacionOtro: 'Investigación formativa interdisciplinaria',
    });
    const errorsValido = await validate(dtoValido);
    expect(errorsValido.some((e) => e.property === 'tipoInvestigacionOtro')).toBe(false);
  });

  it('debe exigir financiamientoDetalle cuando financiamiento es Externo', async () => {
    const dtoInvalido = plainToInstance(CreateTicketDto, {
      titulo: 'Proyecto Valido 2026',
      financiamiento: 'Externo',
    });
    const errors = await validate(dtoInvalido);
    expect(errors.some((e) => e.property === 'financiamientoDetalle')).toBe(true);

    const dtoValido = plainToInstance(CreateTicketDto, {
      titulo: 'Proyecto Valido 2026',
      financiamiento: 'Externo',
      financiamientoDetalle: 'CONCYTEC Fondecyt',
    });
    const errorsValido = await validate(dtoValido);
    expect(errorsValido.some((e) => e.property === 'financiamientoDetalle')).toBe(false);
  });

  it('debe normalizar unidadAcademica a NA si llega vacía u omitida', () => {
    const dtoVacio = plainToInstance(CreateTicketDto, {
      titulo: 'Proyecto Valido 2026',
      unidadAcademica: '',
    });
    expect(dtoVacio.unidadAcademica).toBe('NA');

    const dtoConValor = plainToInstance(CreateTicketDto, {
      titulo: 'Proyecto Valido 2026',
      unidadAcademica: 'Facultad de Ingeniería',
    });
    expect(dtoConValor.unidadAcademica).toBe('Facultad de Ingeniería');
  });

  it('normalizarCondicionales debe limpiar detalles cuando no corresponden', () => {
    const normalizado = normalizarCondicionales({
      titulo: 'Proyecto Valido',
      financiamiento: 'Autofinanciado',
      financiamientoDetalle: 'Texto sobrante',
      tipoInvestigacion: 'Tesis de pregrado',
      tipoInvestigacionOtro: 'Otro texto',
    });
    expect(normalizado.financiamientoDetalle).toBeNull();
    expect(normalizado.tipoInvestigacionOtro).toBeNull();
  });

  it('calcularClaveDuplicidad R6 debe normalizar tildes, mayúsculas y caracteres especiales', () => {
    const clave1 = calcularClaveDuplicidad('  Estudio Genómico en Áncash!!  ', 'EXP-092');
    const clave2 = calcularClaveDuplicidad('estudio genomico en ancash', 'exp-092');
    expect(clave1).toBe(clave2);
    expect(clave1).toBe('estudio genomico en ancash#exp092');
  });

  it('formatearCorrelativo debe generar códigos en formato TCK-YYYY-XXXX y EXP-YYYY-XXXX', () => {
    expect(formatearCorrelativo('TCK', 2026, 1)).toBe('TCK-2026-0001');
    expect(formatearCorrelativo('EXP', 2026, 42)).toBe('EXP-2026-0042');
  });
});
