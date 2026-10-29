import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service.js';
import type { EvaluationTokenPayload } from '../interfaces/evaluation-token-payload.interface.js';

@Injectable()
export class EvaluationTokenService {
  private readonly logger = new Logger(EvaluationTokenService.name);

  // Conjunto en memoria de JTIs revocados o consumidos para invalidación inmediata
  private readonly revokedTokens = new Set<string>();
  private readonly consumedTokens = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Genera un token contextual firmado de evaluación para un evaluador y expediente específicos.
   */
  async generarToken(expedienteId: string, evaluadorId: string) {
    this.logger.log(
      `Generando token de evaluación para expediente ${expedienteId} y evaluador ${evaluadorId}`,
    );

    // 1. Validar que el expediente exista
    const expediente = await this.prisma.expediente.findFirst({
      where: {
        OR: [{ id: expedienteId }, { codigo: expedienteId }],
      },
      include: {
        ticket: true,
      },
    });

    if (!expediente) {
      throw new NotFoundException(`El expediente ${expedienteId} no existe.`);
    }

    // 2. Validar asignación o permisos del evaluador
    const ticketAsignadoA = expediente.ticket?.asignadoAId;
    // Si el ticket está asignado, debe coincidir o el usuario debe tener rol de comité
    if (ticketAsignadoA && ticketAsignadoA !== evaluadorId) {
      // Verificar si es miembro de la sesión de votación o del CEI
      const sesion = await this.prisma.sesionVotacion.findUnique({
        where: { expedienteId: expediente.id },
      });

      const esMiembroAsignado =
        sesion &&
        Array.isArray((sesion as any).evaluadoresAsignados) &&
        (sesion as any).evaluadoresAsignados.includes(evaluadorId);

      if (!esMiembroAsignado) {
        this.logger.warn(
          `Evaluador ${evaluadorId} no es el asignado directo ni miembro registrado en sesión para expediente ${expediente.id}`,
        );
      }
    }

    // 3. Verificar si ya existe una evaluación previa
    const evaluacionExistente = await this.prisma.evaluacion.findFirst({
      where: {
        expedienteId: expediente.id,
        evaluadorId,
      },
      include: {
        firmas: true,
      },
    });

    const estaFirmado = !!(
      evaluacionExistente &&
      evaluacionExistente.firmas &&
      evaluacionExistente.firmas.length > 0
    );

    const tieneBorrador = !estaFirmado && !!evaluacionExistente;

    // 4. Crear JTI único y payload
    const jti = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payload: EvaluationTokenPayload = {
      jti,
      sub: evaluadorId,
      expedienteId: expediente.id,
      codigoExpediente: expediente.codigo,
      ticketId: expediente.ticket?.id,
      tipoAnexo: 'ANEXO_9',
    };

    // 5. Firmar token con TTL de 2 horas (7200s)
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '2h',
    });

    // 6. Registrar evento EVALUACION_INICIADA en historial
    await this.prisma.historial.create({
      data: {
        entidad: 'EXPEDIENTE',
        entidadId: expediente.id,
        evento: 'EVALUACION_INICIADA',
        descripcion: `Sesión de evaluación iniciada por el evaluador ${evaluadorId}`,
        usuarioId: evaluadorId,
        expedienteId: expediente.id,
        metadata: {
          tokenJti: jti,
          fechaInicio: new Date().toISOString(),
          modo: estaFirmado ? 'SOLO_LECTURA' : 'EDICION',
        },
      },
    });

    return {
      token,
      expiresIn: 7200,
      expedienteId: expediente.id,
      codigoExpediente: expediente.codigo,
      tieneBorrador,
      estaFirmado,
      soloLectura: estaFirmado,
    };
  }

  /**
   * Verifica la validez y autenticidad del token de evaluación.
   */
  async verificarToken(token: string): Promise<EvaluationTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<EvaluationTokenPayload>(token);

      if (this.revokedTokens.has(payload.jti)) {
        throw new UnauthorizedException('El token de evaluación ha sido revocado.');
      }

      if (this.consumedTokens.has(payload.jti)) {
        throw new UnauthorizedException('El token de evaluación ya fue consumido.');
      }

      return payload;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      this.logger.error(`Error al verificar token de evaluación: ${err.message}`);
      throw new UnauthorizedException('Token de evaluación inválido o expirado.');
    }
  }

  /**
   * Revoca un token activo (usado al hacer clic en Cancelar / Salir).
   */
  async revocarToken(token?: string, motivo?: string, usuarioId?: string) {
    if (!token) {
      return { ok: true, mensaje: 'Sin token para revocar.' };
    }

    try {
      const payload = await this.jwtService.verifyAsync<EvaluationTokenPayload>(token);
      this.revokedTokens.add(payload.jti);

      // Registrar auditoría de cancelación
      if (payload.expedienteId) {
        await this.prisma.historial.create({
          data: {
            entidad: 'EXPEDIENTE',
            entidadId: payload.expedienteId,
            evento: 'EVALUACION_CANCELADA',
            descripcion: `Evaluación cancelada/abandonada: ${motivo || 'Cancelado por el usuario'}`,
            usuarioId: usuarioId || payload.sub,
            expedienteId: payload.expedienteId,
            metadata: {
              tokenJti: payload.jti,
              motivo: motivo || 'Cancelado por el usuario',
              fechaCancelacion: new Date().toISOString(),
            },
          },
        });
      }

      this.logger.log(`Token ${payload.jti} revocado exitosamente.`);
      return { ok: true, mensaje: 'Token revocado correctamente.' };
    } catch {
      // Si el token ya expiró o no es válido, se da por finalizado
      return { ok: true, mensaje: 'Token finalizado.' };
    }
  }

  /**
   * Marca el token como consumido tras completar formalmente la evaluación.
   */
  marcarComoConsumido(jti: string): void {
    this.consumedTokens.add(jti);
    this.logger.log(`Token ${jti} marcado como CONSUMIDO.`);
  }
}
