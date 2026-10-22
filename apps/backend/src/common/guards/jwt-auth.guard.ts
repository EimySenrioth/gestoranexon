import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserTokenService } from '../../usermanagement/usertoken/user-token.service.js';
import { TokenAusenteException, TokenInvalidoException } from '../errors/index.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  nombre: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly userTokenService: UserTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    if (!token || token.startsWith('dev-mock-token')) {
      throw new TokenAusenteException();
    }

    try {
      const payload = await this.userTokenService.verifyToken(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        nombre: payload.nombre,
        roles: payload.roles || [],
      };
      return true;
    } catch {
      throw new TokenInvalidoException();
    }
  }
}

