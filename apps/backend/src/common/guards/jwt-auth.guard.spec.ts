import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { UserTokenService } from '../../usermanagement/usertoken/user-token.service.js';
import { TokenAusenteException, TokenInvalidoException } from '../errors/index.js';

describe('JwtAuthGuard (Endurecido sin mocks)', () => {
  let guard: JwtAuthGuard;
  let userTokenServiceMock: Partial<UserTokenService>;

  beforeEach(() => {
    userTokenServiceMock = {
      verifyToken: vi.fn(),
    };
    guard = new JwtAuthGuard(userTokenServiceMock as UserTokenService);
  });

  function createMockContext(headers: Record<string, string> = {}, cookies: Record<string, string> = {}) {
    const request: any = {
      headers,
      cookies,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('debe lanzar TokenAusenteException si no se envía header ni cookie', async () => {
    const ctx = createMockContext();
    await expect(guard.canActivate(ctx)).rejects.toThrow(TokenAusenteException);
  });

  it('debe lanzar TokenAusenteException si se envía un token dev-mock-token', async () => {
    const ctx = createMockContext({ authorization: 'Bearer dev-mock-token-12345' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(TokenAusenteException);
  });

  it('debe lanzar TokenInvalidoException si verifyToken falla', async () => {
    vi.mocked(userTokenServiceMock.verifyToken!).mockRejectedValue(new Error('Firma inválida o expirado'));
    const ctx = createMockContext({ authorization: 'Bearer jwt.invalido.firmamal' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(TokenInvalidoException);
  });

  it('debe retornar true y poblar request.user si el token es válido', async () => {
    vi.mocked(userTokenServiceMock.verifyToken!).mockResolvedValue({
      sub: 'usr_real_99',
      email: 'solicitante@untels.edu.pe',
      nombre: 'Investigador Principal',
      roles: ['SOLICITANTE'],
    } as any);

    const ctx = createMockContext({ authorization: 'Bearer jwt.valido.ok' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    const req = ctx.switchToHttp().getRequest() as any;
    expect(req.user).toEqual({
      id: 'usr_real_99',
      email: 'solicitante@untels.edu.pe',
      nombre: 'Investigador Principal',
      roles: ['SOLICITANTE'],
    });
  });
});
