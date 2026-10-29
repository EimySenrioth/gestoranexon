import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { RegistrarFirmaDto } from '../dto/registrar-firma.dto.js';
import type { FirmaResultado } from '../interfaces/firma-resultado.interface.js';

export interface MetadatosAuditoriaFirma {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class FirmaService {
  private readonly logger = new Logger(FirmaService.name);

  private readonly DATA_URL_REGEX =
    /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida el formato MIME Base64 del trazo de firma y calcula su hash SHA-256.
   */
  validarYCalcularHash(firmaDataUrl: string): string {
    if (!firmaDataUrl || !this.DATA_URL_REGEX.test(firmaDataUrl)) {
      throw new BadRequestException(
        'El formato de la firma digital no es válido. Se requiere un DataURL Base64 de imagen (ej. data:image/png;base64,...).',
      );
    }

    return createHash('sha256').update(firmaDataUrl).digest('hex');
  }

  /**
   * Registra la firma digital en la base de datos (compatible con transacción Prisma o cliente estándar).
   */
  async registrarFirma(
    evaluacionId: string,
    firmadoPor: string,
    dto: RegistrarFirmaDto,
    auditoria?: MetadatosAuditoriaFirma,
    tx?: Prisma.TransactionClient,
  ): Promise<FirmaResultado> {
    if (dto.declaracionAceptada === false) {
      throw new BadRequestException(
        'Debe aceptar la declaración jurada para registrar la firma.',
      );
    }

    const hashSha256 = this.validarYCalcularHash(dto.firmaDataUrl);
    const db = tx || this.prisma;

    this.logger.log(
      `Registrando firma digital para evaluación ${evaluacionId} por usuario ${firmadoPor} [SHA-256: ${hashSha256.substring(0, 12)}...]`,
    );

    const firmaCreada = await db.firma.create({
      data: {
        evaluacionId,
        firmadoPor,
        firma: dto.firmaDataUrl,
        hashSha256,
        ipAddress: auditoria?.ipAddress || null,
        userAgent: auditoria?.userAgent || null,
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    return {
      id: firmaCreada.id,
      evaluacionId: firmaCreada.evaluacionId,
      firmadoPor: firmaCreada.firmadoPor,
      nombreFirmante: firmaCreada.usuario
        ? `${firmaCreada.usuario.nombre} ${firmaCreada.usuario.apellido}`.trim()
        : undefined,
      emailFirmante: firmaCreada.usuario?.email,
      firmaDataUrl: firmaCreada.firma,
      hashSha256: firmaCreada.hashSha256,
      ipAddress: firmaCreada.ipAddress,
      userAgent: firmaCreada.userAgent,
      creadoEn: firmaCreada.creadoEn,
    };
  }

  /**
   * Obtiene el comprobante y estampa probatoria de la firma asociada a una evaluación.
   */
  async obtenerFirmaPorEvaluacion(evaluacionId: string): Promise<FirmaResultado> {
    const firma = await this.prisma.firma.findFirst({
      where: { evaluacionId },
      orderBy: { creadoEn: 'desc' },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    if (!firma) {
      throw new NotFoundException(
        `No se encontró una firma registrada para la evaluación ${evaluacionId}.`,
      );
    }

    return {
      id: firma.id,
      evaluacionId: firma.evaluacionId,
      firmadoPor: firma.firmadoPor,
      nombreFirmante: firma.usuario
        ? `${firma.usuario.nombre} ${firma.usuario.apellido}`.trim()
        : undefined,
      emailFirmante: firma.usuario?.email,
      firmaDataUrl: firma.firma,
      hashSha256: firma.hashSha256,
      ipAddress: firma.ipAddress,
      userAgent: firma.userAgent,
      creadoEn: firma.creadoEn,
    };
  }
}

