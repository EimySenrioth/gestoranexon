import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  UseGuards,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserManagementService } from './usermanagement.service.js';
import { RefreshTokenService, type RequestMeta } from './refreshtoken/refresh-token.service.js';
import { CreateUserDto, AssignRolesDto, LoginUserDto } from './dto/index.js';

// ───────────── Configuración de Cookies ─────────────

export const REFRESH_COOKIE = 'refresh_token';
const COOKIE_PATH = '/api';

function cookieBase() {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = (process.env.COOKIE_SAMESITE as 'strict' | 'lax' | 'none') ?? 'lax';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite,
    path: COOKIE_PATH,
  } as const;
}

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, { ...cookieBase(), expires: expiresAt });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, cookieBase());
}

const metaOf = (req: Request): RequestMeta => ({
  userAgent: req.headers['user-agent'],
  ip: req.ip,
});

// ───────────── Guard CSRF para /refresh y /logout ─────────────

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    // Un <form> cross-site no puede enviar headers custom; un fetch cross-site dispara preflight CORS.
    const customHeader = req.header('x-requested-with');
    if (customHeader !== 'EstanciaPeru') {
      throw new ForbiddenException('Petición no permitida (Falta cabecera X-Requested-With)');
    }
    return true;
  }
}

// ───────────── Controlador Principal ─────────────

@Controller('api/v1/users')
export class UserManagementController {
  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post()
  createUser(@Body() dto: CreateUserDto) {
    return this.userManagementService.createUser(dto);
  }

  /**
   * Inicio de sesión: Valida usuario, genera access token (15m) e inyecta cookie de refresh token rotativo.
   */
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.userManagementService.validateUser(dto);
    const session = await this.refreshTokenService.startSession(user.id, metaOf(req));

    if (session.refreshToken && session.refreshExpiresAt) {
      setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
    }

    return {
      accessToken: session.accessToken,
      tokenType: 'Bearer',
      expiresIn: '15m',
      homeView: session.usuario.homeView,
      user: {
        id: session.usuario.id,
        email: session.usuario.email,
        nombre: session.usuario.nombre,
        roles: session.usuario.roles,
      },
    };
  }

  /**
   * Rotación de Refresh Token: Valida cookie, genera nuevo par y aplica detección de reuso.
   */
  @Post('refresh')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const rawToken = req.cookies?.[REFRESH_COOKIE];
      const session = await this.refreshTokenService.rotate(rawToken, metaOf(req));

      if (session.refreshToken && session.refreshExpiresAt) {
        setRefreshCookie(res, session.refreshToken, session.refreshExpiresAt);
      }

      return {
        accessToken: session.accessToken,
        tokenType: 'Bearer',
        expiresIn: '15m',
        homeView: session.usuario.homeView,
        user: {
          id: session.usuario.id,
          email: session.usuario.email,
          nombre: session.usuario.nombre,
          roles: session.usuario.roles,
        },
      };
    } catch (error) {
      clearRefreshCookie(res);
      throw error;
    }
  }

  /**
   * Cierre de sesión individual: Invalida la familia del token y limpia la cookie del navegador.
   */
  @Post('logout')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    await this.refreshTokenService.revokeByRawToken(rawToken);
    clearRefreshCookie(res);
    return { ok: true, message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Cierre de sesión en todos los dispositivos: Revoca todas las sesiones del usuario.
   */
  @Post('logout-all')
  @HttpCode(200)
  @UseGuards(CsrfGuard)
  async logoutAll(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE];
    if (rawToken) {
      const user = await this.refreshTokenService.loadSessionUser(rawToken);
      if (user?.id) {
        await this.refreshTokenService.revokeAllForUser(user.id);
      }
    }
    clearRefreshCookie(res);
    return { ok: true, message: 'Todas las sesiones fueron cerradas' };
  }

  @Get()
  findAll(@Query('roleId') roleId?: string) {
    return this.userManagementService.findAll(
      roleId ? { roleId: parseInt(roleId, 10) } : undefined,
    );
  }

  @Get('comite')
  getComiteMembers() {
    return this.userManagementService.getComiteMembers();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userManagementService.findById(id);
  }

  @Patch(':id/roles')
  assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    return this.userManagementService.assignRoles(id, dto);
  }
}
