import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception.js';

export class SolicitudNoEncontradaException extends BaseException {
  constructor(id?: string) {
    super(
      HttpStatus.NOT_FOUND,
      'TKT-001',
      'Solicitud no encontrada',
      id ? { id } : undefined,
    );
  }
}

export class TicketNoEncontradoException extends BaseException {
  constructor(id?: string) {
    super(
      HttpStatus.NOT_FOUND,
      'TKT-002',
      'Ticket no encontrado',
      id ? { id } : undefined,
    );
  }
}
