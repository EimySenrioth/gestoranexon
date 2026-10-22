import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { RolesNoAsignadosException, PermisosInsuficientesException } from '../errors/index.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<Request>();
    if (!user || !user.roles) {
      throw new RolesNoAsignadosException();
    }

    const hasRole = requiredRoles.some((role) =>
      user.roles.map((r) => r.toUpperCase()).includes(role.toUpperCase()),
    );

    if (!hasRole) {
      throw new PermisosInsuficientesException();
    }

    return true;
  }
}
