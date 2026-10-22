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

export class ExpedienteYaAsignadoException extends BaseException {
  constructor(expedienteId: string, asignadoAId?: string) {
    super(
      HttpStatus.CONFLICT,
      'EXP-002',
      `El expediente con ID ${expedienteId} ya se encuentra asignado y en proceso de evaluación.`,
      { expedienteId, asignadoAId },
    );
  }
}

export class MiembroCeiNoEncontradoException extends BaseException {
  constructor(usuarioId: string) {
    super(
      HttpStatus.NOT_FOUND,
      'EXP-003',
      `El usuario con ID ${usuarioId} no fue encontrado para asignación.`,
      { usuarioId },
    );
  }
}

export class UsuarioNoEsMiembroCeiException extends BaseException {
  constructor(usuarioId: string, rolesActuales: string[]) {
    super(
      HttpStatus.BAD_REQUEST,
      'EXP-004',
      `El usuario con ID ${usuarioId} no pertenece al Comité de Ética (CEI). Roles requeridos: Presidente, Vicepresidente, Secretaría Técnica, Secretaría Administrativa o Vocal.`,
      { usuarioId, rolesActuales },
    );
  }
}

export class ExpedienteNoAptoParaAsignacionException extends BaseException {
  constructor(expedienteId: string, estadoActual: string) {
    super(
      HttpStatus.BAD_REQUEST,
      'EXP-005',
      `El expediente con ID ${expedienteId} está en estado "${estadoActual}" y no es apto para asignación (debe estar en INICIADO).`,
      { expedienteId, estadoActual },
    );
  }
}

