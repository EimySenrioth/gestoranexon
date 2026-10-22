import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception.js';

export class CorreoYaRegistradoException extends BaseException {
  constructor(email?: string) {
    super(
      HttpStatus.CONFLICT,
      'USR-001',
      email ? `El correo ${email} ya está registrado.` : 'El correo ya está registrado.',
      email ? { email } : undefined,
    );
  }
}

export class UsuarioNoEncontradoException extends BaseException {
  constructor(id?: string) {
    super(
      HttpStatus.NOT_FOUND,
      'USR-002',
      id ? `Usuario con ID ${id} no encontrado.` : 'Usuario no encontrado.',
      id ? { id } : undefined,
    );
  }
}
