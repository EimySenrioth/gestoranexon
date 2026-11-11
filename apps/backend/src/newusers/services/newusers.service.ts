import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  REGISTRO_PASSWORD_MSG,
  REGISTRO_PASSWORD_REGEX,
  RegisterSolicitanteDto,
  RegisterSolicitanteResponseDto,
} from '../dto/index.js';

export const ROL_SOLICITANTE_FIJO_ID = 1;

@Injectable()
export class NewUsersService {
  private readonly logger = new Logger(NewUsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Separa el nombre completo en nombre y apellido si no se proporcionó apellido por separado.
   */
  private normalizarNombreYApellido(
    nombreRaw: string,
    apellidoRaw?: string,
  ): { nombre: string; apellido: string } {
    const nombreTrim = (nombreRaw || '').trim();
    const apellidoTrim = (apellidoRaw || '').trim();

    if (apellidoTrim.length > 0) {
      return { nombre: nombreTrim, apellido: apellidoTrim };
    }

    const partes = nombreTrim.split(/\s+/).filter(Boolean);
    if (partes.length <= 1) {
      return { nombre: nombreTrim, apellido: '' };
    }
    if (partes.length === 2) {
      return { nombre: partes[0], apellido: partes[1] };
    }

    const tienePrefijo = /^(dr\.|dra\.|mg\.|lic\.|ing\.|bach\.|est\.)$/i.test(
      partes[0],
    );
    if (tienePrefijo && partes.length >= 3) {
      return {
        nombre: `${partes[0]} ${partes[1]}`,
        apellido: partes.slice(2).join(' '),
      };
    }

    const mitad = Math.ceil(partes.length / 2);
    return {
      nombre: partes.slice(0, mitad).join(' '),
      apellido: partes.slice(mitad).join(' '),
    };
  }

  /**
   * Registra públicamente un nuevo usuario asignándole única y exclusivamente
   * el rol de Solicitante / Investigador (rolId = 1).
   */
  async registrarSolicitante(
    dto: RegisterSolicitanteDto,
  ): Promise<RegisterSolicitanteResponseDto> {
    const emailNorm = (dto.email || '').toLowerCase().trim();
    const nombreRaw = (dto.nombre || '').trim();

    if (!nombreRaw || !emailNorm) {
      throw new BadRequestException(
        'El nombre completo y el correo electrónico son obligatorios.',
      );
    }

    const passTrim = (dto.password || '').trim();
    if (!REGISTRO_PASSWORD_REGEX.test(passTrim)) {
      throw new BadRequestException(REGISTRO_PASSWORD_MSG);
    }

    if (
      dto.confirmarPassword !== undefined &&
      dto.confirmarPassword.trim() !== passTrim
    ) {
      throw new BadRequestException(
        'La contraseña y su confirmación no coinciden.',
      );
    }

    const existente = await this.prisma.usuario.findUnique({
      where: { email: emailNorm },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe una cuenta registrada con el correo electrónico "${emailNorm}".`,
      );
    }

    const { nombre, apellido } = this.normalizarNombreYApellido(
      nombreRaw,
      dto.apellido,
    );

    const nuevoSolicitante = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.usuario.create({
        data: {
          email: emailNorm,
          nombre,
          apellido,
          password: passTrim,
          activo: true,
          roles: {
            create: [{ rolId: ROL_SOLICITANTE_FIJO_ID }],
          },
        },
        include: {
          roles: {
            include: {
              rol: true,
            },
          },
        },
      });

      await tx.historial.create({
        data: {
          entidad: 'Usuario',
          entidadId: creado.id,
          evento: 'AUTO_REGISTRO_SOLICITANTE',
          descripcion: `Auto-registro de solicitante ${creado.email} desde la pestaña "¿eres nuevo?"`,
          usuarioId: creado.id,
          metadata: {
            email: creado.email,
            rolId: ROL_SOLICITANTE_FIJO_ID,
            rolCodigo: 'SOLICITANTE',
          },
        },
      });

      return creado;
    });

    this.logger.log(
      `Nuevo solicitante auto-registrado: ${nuevoSolicitante.email} (${nuevoSolicitante.id})`,
    );

    const rolEtiqueta =
      nuevoSolicitante.roles?.[0]?.rol?.nombre || 'Solicitante / Investigador';

    return {
      id: nuevoSolicitante.id,
      nombre: nuevoSolicitante.nombre,
      apellido: nuevoSolicitante.apellido,
      nombreCompleto:
        `${nuevoSolicitante.nombre} ${nuevoSolicitante.apellido}`.trim(),
      email: nuevoSolicitante.email,
      rolId: 1,
      rolCodigo: 'SOLICITANTE',
      rolEtiqueta,
      activo: Boolean(nuevoSolicitante.activo),
      creadoEn: nuevoSolicitante.creadoEn.toISOString(),
    };
  }
}

