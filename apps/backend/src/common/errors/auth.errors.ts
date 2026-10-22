import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception.js';

export class TokenAusenteException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-001', 'Token de autorización ausente');
  }
}

export class TokenInvalidoException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-002', 'Token de autenticación expirado o inválido');
  }
}

export class RolesNoAsignadosException extends BaseException {
  constructor() {
    super(HttpStatus.FORBIDDEN, 'AUTH-003', 'Acceso denegado: usuario sin roles asignados');
  }
}

export class PermisosInsuficientesException extends BaseException {
  constructor() {
    super(HttpStatus.FORBIDDEN, 'AUTH-004', 'Acceso denegado: permisos insuficientes para esta operación');
  }
}

export class HeaderServiceTokenRequeridoException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-005', 'Acceso denegado: Cabecera X-Service-Token requerida');
  }
}

export class ServiceTokenInvalidoException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-006', 'Acceso denegado: Token de servicio inválido');
  }
}

export class CredencialesInvalidasException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-007', 'Credenciales inválidas o usuario inactivo.');
  }
}

export class UsuarioInactivoException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-008', 'Usuario inactivo o inexistente');
  }
}

export class RefreshTokenAusenteException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-009', 'Sin refresh token');
  }
}

export class RefreshTokenInvalidoException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-010', 'Refresh token inválido');
  }
}

export class RefreshTokenExpiradoException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-011', 'Refresh token expirado');
  }
}

export class SesionExpiradaException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-012', 'Sesión expirada, inicia sesión de nuevo');
  }
}

export class SesionInvalidadaException extends BaseException {
  constructor() {
    super(HttpStatus.UNAUTHORIZED, 'AUTH-013', 'Sesión invalidada por seguridad');
  }
}

export class CsrfHeaderRequeridoException extends BaseException {
  constructor() {
    super(HttpStatus.FORBIDDEN, 'AUTH-014', 'Petición no permitida (Falta cabecera X-Requested-With)');
  }
}
