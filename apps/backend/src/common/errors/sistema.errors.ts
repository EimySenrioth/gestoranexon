import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception.js';

export class BaseDatosNoDisponibleException extends BaseException {
  constructor(detalle?: unknown) {
    super(
      HttpStatus.SERVICE_UNAVAILABLE,
      'SYS-001',
      'Servicio de base de datos no disponible',
      detalle,
    );
  }
}

export class ErrorInternoServidorException extends BaseException {
  constructor(detalle?: unknown) {
    super(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'SYS-002',
      'Error interno del servidor',
      detalle,
    );
  }
}

export class RegistroDuplicadoException extends BaseException {
  constructor(detalle?: unknown) {
    super(
      HttpStatus.CONFLICT,
      'SYS-003',
      'El registro ya existe en la base de datos',
      detalle,
    );
  }
}

export class ValidacionDatosException extends BaseException {
  constructor(campos?: unknown) {
    super(
      HttpStatus.BAD_REQUEST,
      'VAL-001',
      'Datos de entrada inválidos',
      campos,
    );
  }
}
