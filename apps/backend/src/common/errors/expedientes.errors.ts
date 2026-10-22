import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception.js';

export class ExpedienteNoEncontradoException extends BaseException {
  constructor(id?: string) {
    super(
      HttpStatus.NOT_FOUND,
      'EXP-001',
      id ? `Expediente con ID ${id} no encontrado.` : 'Expediente no encontrado.',
      id ? { id } : undefined,
    );
  }
}

export class PaginacionInvalidaException extends BaseException {
  constructor(detalle?: unknown) {
    super(
      HttpStatus.BAD_REQUEST,
      'SOL-001',
      'Parámetros de paginación inválidos',
      detalle,
    );
  }
}
