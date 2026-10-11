import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserTokenPayload, UserTokenResponse } from './user-token.types.js';

@Injectable()
export class UserTokenService {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Determina la vista principal según el rol:
   * - 'SOLICITANTE': ve la Vista 1 ('/inicio')
   * - Todos los demás roles (Comité CEI, Evaluadores, Administrador): ven la Vista 2 ('/homeview2')
   */
  determineHomeView(roles: string[]): 'inicio' | 'homeview2' {
    const isOnlySolicitante =
      roles.length === 1 && roles[0].toUpperCase() === 'SOLICITANTE';

    if (isOnlySolicitante) {
      return 'inicio';
    }

    return 'homeview2';
  }

  /**
   * Genera el JWT incorporando los roles y la directiva de homeView para el frontend.
   */
  async generateToken(user: {
    id: string;
    email: string;
    nombre: string;
    roles: string[];
  }): Promise<UserTokenResponse> {
    const homeView = this.determineHomeView(user.roles);

    const payload: UserTokenPayload = {
      sub: user.id,
      email: user.email,
      nombre: user.nombre,
      roles: user.roles,
      homeView,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '24h',
      homeView,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        roles: user.roles,
      },
    };
  }

  /**
   * Valida y decodifica un token JWT.
   */
  async verifyToken(token: string): Promise<UserTokenPayload> {
    return this.jwtService.verifyAsync<UserTokenPayload>(token);
  }
}
