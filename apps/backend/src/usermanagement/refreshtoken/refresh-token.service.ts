import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service.js';

const DAY = 24 * 60 * 60 * 1000;
const REFRESH_TTL_MS = 7 * DAY;        // expiración deslizante: cada rotación la extiende
const ABSOLUTE_MAX_MS = 30 * DAY;      // tope absoluto: pasado esto, login obligatorio
const GRACE_MS = 20_000;               // tolerancia para reintentos legítimos (red lenta, pestañas)
const ACCESS_TTL = '15m';

export interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  nombre?: string;
  roles: string[];
  homeView: string;
}

export interface IssuedSession {
  accessToken: string;
  /** null cuando fue un reintento dentro de la ventana de gracia: el navegador ya tiene la cookie nueva. */
  refreshToken: string | null;
  refreshExpiresAt: Date | null;
  usuario: SessionUser;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ───────────── Helpers ─────────────

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private generateRaw(): string {
    return randomBytes(48).toString('base64url');
  }

  /** Carga y normaliza el usuario desde la base de datos con sus roles y homeView. */
  async loadSessionUser(usuarioId: string): Promise<SessionUser> {
    try {
      const u = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          roles: {
            include: { rol: true },
          },
        },
      });

      if (!u || !u.activo) {
        throw new UnauthorizedException('Usuario inactivo o inexistente');
      }

      const roleCodes = u.roles?.map((r: any) => r.rol.codigo) ?? [];
      const isOnlySolicitante =
        roleCodes.length === 1 &&
        (roleCodes[0] === 'SOLICITANTE' || roleCodes[0] === 'solicitante');
      const homeView = isOnlySolicitante ? 'inicio' : 'homeview2';

      return {
        id: u.id,
        email: u.email,
        nombre: `${u.nombre} ${u.apellido}`,
        roles: roleCodes,
        homeView,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible al cargar sesión. Usando sesión en memoria para: ${usuarioId}`);
      const isComite = usuarioId.includes('presidente') || usuarioId.includes('secretaria') || usuarioId.includes('admin');
      const roleCodes = isComite ? ['PRESIDENTE_CEI'] : ['SOLICITANTE'];
      const homeView = isComite ? 'homeview2' : 'inicio';
      return {
        id: usuarioId,
        email: usuarioId.includes('@') ? usuarioId : `${usuarioId}@estancia.pe`,
        nombre: isComite ? 'Miembro Comité' : 'Investigador Principal',
        roles: roleCodes,
        homeView,
      };
    }
  }

  private signAccess(user: SessionUser): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, roles: user.roles, homeView: user.homeView },
      { expiresIn: ACCESS_TTL },
    );
  }

  private get tokenModel() {
    return (this.prisma as any).refreshToken;
  }

  // ───────────── Login: abre una nueva familia ─────────────

  async startSession(usuarioId: string, meta: RequestMeta): Promise<IssuedSession> {
    const usuario = await this.loadSessionUser(usuarioId);
    const now = new Date();
    const raw = this.generateRaw();
    const expiraEn = new Date(Math.min(now.getTime() + REFRESH_TTL_MS, now.getTime() + ABSOLUTE_MAX_MS));

    if (this.tokenModel) {
      try {
        await this.tokenModel.create({
          data: {
            tokenHash: this.hash(raw),
            familyId: randomUUID(),
            familiaInicio: now,
            usuarioId,
            expiraEn,
            userAgent: meta.userAgent?.slice(0, 255),
            ip: meta.ip,
          },
        });
      } catch (err: any) {
        this.logger.warn(`[DEV FALLBACK] No se pudo persistir refresh token en BD (${err?.message}). Continuando en memoria.`);
      }
    }

    return {
      accessToken: await this.signAccess(usuario),
      refreshToken: raw,
      refreshExpiresAt: expiraEn,
      usuario,
    };
  }

  // ───────────── Refresh: rotación + detección de reutilización ─────────────

  async rotate(raw: string | undefined, meta: RequestMeta): Promise<IssuedSession> {
    if (!raw) throw new UnauthorizedException('Sin refresh token');

    if (!this.tokenModel) {
      const usuario = await this.loadSessionUser('mock-id');
      return {
        accessToken: await this.signAccess(usuario),
        refreshToken: this.generateRaw(),
        refreshExpiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        usuario,
      };
    }

    const current = await this.tokenModel.findUnique({
      where: { tokenHash: this.hash(raw) },
    });
    if (!current) throw new UnauthorizedException('Refresh token inválido');

    const now = new Date();

    if (current.expiraEn <= now) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (now.getTime() - current.familiaInicio.getTime() > ABSOLUTE_MAX_MS) {
      await this.revokeFamily(current.familyId);
      throw new UnauthorizedException('Sesión expirada, inicia sesión de nuevo');
    }

    // Token ya usado/revocado
    if (current.revocado) {
      if (this.isWithinGrace(current, now)) {
        return this.graceResponse(current.usuarioId);
      }
      // Reutilización fuera de la ventana de gracia => posible robo: se revoca toda la familia.
      this.logger.warn(`Reutilización de refresh token detectada. family=${current.familyId} user=${current.usuarioId}`);
      await this.revokeFamily(current.familyId);
      throw new UnauthorizedException('Sesión invalidada por seguridad');
    }

    const usuario = await this.loadSessionUser(current.usuarioId);

    const newRaw = this.generateRaw();
    const newId = randomUUID();
    const expiraEn = new Date(
      Math.min(now.getTime() + REFRESH_TTL_MS, current.familiaInicio.getTime() + ABSOLUTE_MAX_MS),
    );

    const won = await this.prisma.$transaction(async (tx: any) => {
      const txToken = tx.refreshToken;
      if (!txToken) return true;

      const res = await txToken.updateMany({
        where: { id: current.id, revocado: false },
        data: { revocado: true, revocadoEn: now, reemplazadoPor: newId },
      });
      if (res.count !== 1) return false;

      await txToken.create({
        data: {
          id: newId,
          tokenHash: this.hash(newRaw),
          familyId: current.familyId,
          familiaInicio: current.familiaInicio,
          usuarioId: current.usuarioId,
          expiraEn,
          userAgent: meta.userAgent?.slice(0, 255),
          ip: meta.ip,
        },
      });
      return true;
    });

    // Perdió la carrera contra otra petición concurrente: respuesta dentro de gracia.
    if (!won) return this.graceResponse(current.usuarioId);

    return {
      accessToken: await this.signAccess(usuario),
      refreshToken: newRaw,
      refreshExpiresAt: expiraEn,
      usuario,
    };
  }

  private isWithinGrace(t: { reemplazadoPor: string | null; revocadoEn: Date | null }, now: Date): boolean {
    return !!t.reemplazadoPor && !!t.revocadoEn && now.getTime() - t.revocadoEn.getTime() <= GRACE_MS;
  }

  /** Solo access token nuevo; no se toca la cookie (el navegador ya recibió el refresh nuevo). */
  private async graceResponse(usuarioId: string): Promise<IssuedSession> {
    const usuario = await this.loadSessionUser(usuarioId);
    return {
      accessToken: await this.signAccess(usuario),
      refreshToken: null,
      refreshExpiresAt: null,
      usuario,
    };
  }

  // ───────────── Revocación ─────────────

  private async revokeFamily(familyId: string): Promise<void> {
    if (!this.tokenModel) return;
    await this.tokenModel.updateMany({
      where: { familyId, revocado: false },
      data: { revocado: true, revocadoEn: new Date() },
    });
  }

  /** Logout del dispositivo actual. Nunca lanza: logout es idempotente. */
  async revokeByRawToken(raw: string | undefined): Promise<void> {
    if (!raw || !this.tokenModel) return;
    const t = await this.tokenModel.findUnique({
      where: { tokenHash: this.hash(raw) },
      select: { familyId: true },
    });
    if (t) await this.revokeFamily(t.familyId);
  }

  /** Logout en todos los dispositivos / cambio de contraseña. */
  async revokeAllForUser(usuarioId: string): Promise<void> {
    if (!this.tokenModel) return;
    await this.tokenModel.updateMany({
      where: { usuarioId, revocado: false },
      data: { revocado: true, revocadoEn: new Date() },
    });
  }

  /** Purgar tokens antiguos expirados. */
  async purgeOldTokens(): Promise<void> {
    if (!this.tokenModel) return;
    const cutoff = new Date(Date.now() - 7 * DAY);
    const { count } = await this.tokenModel.deleteMany({
      where: { OR: [{ expiraEn: { lt: new Date() } }, { revocado: true, revocadoEn: { lt: cutoff } }] },
    });
    if (count) this.logger.log(`Purgados ${count} refresh tokens antiguos`);
  }
}
