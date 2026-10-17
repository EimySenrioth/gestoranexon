import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import crypto from 'crypto';

@Injectable()
export class ServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const tokenHeader = request.header('x-service-token');

    if (!tokenHeader) {
      throw new UnauthorizedException('Acceso denegado: Cabecera X-Service-Token requerida');
    }

    const expectedToken =
      process.env.CEI_SERVICE_TOKEN || 'estanciaperu_cei_service_token_secret_2026';

    const headerBuf = Buffer.from(tokenHeader, 'utf-8');
    const expectedBuf = Buffer.from(expectedToken, 'utf-8');

    if (
      headerBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(headerBuf, expectedBuf)
    ) {
      throw new UnauthorizedException('Acceso denegado: Token de servicio inválido');
    }

    return true;
  }
}
