import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EvaluationTokenService } from './evaluation-token.service.js';
import { FirmaService, type MetadatosAuditoriaFirma } from './firma.service.js';
import { CompletarAnexo9Dto, GuardarBorradorAnexoDto } from '../dto/index.js';
import { ResultadoEvaluacion } from '@prisma/client';

@Injectable()
export class AnexoEvaluacionService {
  private readonly logger = new Logger(AnexoEvaluacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: EvaluationTokenService,
    private readonly firmaService: FirmaService,
  ) {}

  /**
   * Resuelve el CUID real del expediente a partir de su ID o de su código (ej. EXP-2026-0013).
   */
  private async resolverExpedienteId(idOCodigo: string): Promise<string> {
    const exp = await this.prisma.expediente.findFirst({
      where: {
        OR: [{ id: idOCodigo }, { codigo: idOCodigo }],
      },
      select: { id: true },
    });
    if (!exp) {
      throw new NotFoundException(`El expediente ${idOCodigo} no existe.`);
    }
    return exp.id;
  }

  /**
   * Obtiene el estado actual del Anexo N°9 (Borrador previo o versión firmada).
   */
  async obtenerEstadoAnexo(expedienteId: string, evaluadorId: string) {
    const realExpedienteId = await this.resolverExpedienteId(expedienteId);
    const evaluacion = await this.prisma.evaluacion.findFirst({
      where: {
        expedienteId: realExpedienteId,
        evaluadorId,
      },
      include: {
        firmas: {
          orderBy: { creadoEn: 'desc' },
          take: 1,
        },
      },
    });

    if (!evaluacion) {
      return {
        estado: 'NUEVO',
        soloLectura: false,
        datos: null,
      };
    }

    const estaFirmado = evaluacion.firmas && evaluacion.firmas.length > 0;

    let principiosEticos = [];
    let metodologiaRiesgos = [];
    let normativaLegal = [];

    try {
      if (evaluacion.principiosEticos) {
        principiosEticos = JSON.parse(evaluacion.principiosEticos);
      }
      if (evaluacion.metodologiaRiesgos) {
        metodologiaRiesgos = JSON.parse(evaluacion.metodologiaRiesgos);
      }
      if (evaluacion.normativaLegal) {
        normativaLegal = JSON.parse(evaluacion.normativaLegal);
      }
    } catch {
      this.logger.warn(`Error al parsear JSON almacenado en evaluación ${evaluacion.id}`);
    }

    return {
      estado: estaFirmado ? 'FIRMADO' : 'BORRADOR',
      soloLectura: estaFirmado,
      datos: {
        id: evaluacion.id,
        expedienteId: evaluacion.expedienteId,
        principiosEticos,
        metodologiaRiesgos,
        normativaLegal,
        resultado: evaluacion.resultado,
        recomendacion: evaluacion.recomendacion,
        ultimaActualizacion: evaluacion.actualizadoEn,
        firma: estaFirmado
          ? {
              id: evaluacion.firmas[0].id,
              firmadoPor: evaluacion.firmas[0].firmadoPor,
              firmaDataUrl: evaluacion.firmas[0].firma,
              hashSha256: evaluacion.firmas[0].hashSha256,
              creadoEn: evaluacion.firmas[0].creadoEn,
            }
          : null,
      },
    };
  }

  /**
   * Guarda un borrador parcial sin emitir la firma final.
   */
  async guardarBorrador(evaluadorId: string, dto: GuardarBorradorAnexoDto) {
    const realExpedienteId = await this.resolverExpedienteId(dto.expedienteId);
    this.logger.log(`Guardando borrador de Anexo N°9 para expediente ${realExpedienteId}`);

    const dictamenEnum = dto.dictamen ? this.mapearResultado(dto.dictamen) : undefined;

    const evaluacion = await this.prisma.evaluacion.upsert({
      where: {
        expedienteId_evaluadorId: {
          expedienteId: realExpedienteId,
          evaluadorId,
        },
      },
      update: {
        principiosEticos: dto.principiosEticos ? JSON.stringify(dto.principiosEticos) : undefined,
        metodologiaRiesgos: dto.metodologiaRiesgos
          ? JSON.stringify(dto.metodologiaRiesgos)
          : undefined,
        normativaLegal: dto.normativaLegal ? JSON.stringify(dto.normativaLegal) : undefined,
        resultado: dictamenEnum,
        recomendacion: dto.observacionesGenerales,
        actualizadoEn: new Date(),
      },
      create: {
        expedienteId: realExpedienteId,
        evaluadorId,
        principiosEticos: dto.principiosEticos ? JSON.stringify(dto.principiosEticos) : undefined,
        metodologiaRiesgos: dto.metodologiaRiesgos
          ? JSON.stringify(dto.metodologiaRiesgos)
          : undefined,
        normativaLegal: dto.normativaLegal ? JSON.stringify(dto.normativaLegal) : undefined,
        resultado: dictamenEnum,
        recomendacion: dto.observacionesGenerales,
      },
    });

    // Auditoría de guardado de borrador
    await this.prisma.historial.create({
      data: {
        entidad: 'EVALUACION',
        entidadId: evaluacion.id,
        evento: 'EVALUACION_BORRADOR_GUARDADO',
        descripcion: `Avance parcial del Anexo N°9 guardado por evaluador ${evaluadorId}`,
        usuarioId: evaluadorId,
        expedienteId: realExpedienteId,
      },
    });

    return {
      ok: true,
      mensaje: 'Borrador guardado exitosamente.',
      evaluacionId: evaluacion.id,
    };
  }

  /**
   * Transacción atómica que finaliza y firma la evaluación del Anexo N°9.
   */
  async completarAnexo(
    evaluadorId: string,
    tokenJti: string,
    dto: CompletarAnexo9Dto,
    auditoria?: MetadatosAuditoriaFirma,
  ) {
    const realExpedienteId = await this.resolverExpedienteId(dto.expedienteId);
    this.logger.log(
      `Completando formalmente evaluación de Anexo N°9 para expediente ${realExpedienteId} (${dto.expedienteId})`,
    );

    const resultadoEnum = this.mapearResultado(dto.dictamen);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Upsert en la tabla 'evaluaciones'
      const evaluacion = await tx.evaluacion.upsert({
        where: {
          expedienteId_evaluadorId: {
            expedienteId: realExpedienteId,
            evaluadorId,
          },
        },
        update: {
          principiosEticos: JSON.stringify(dto.principiosEticos),
          metodologiaRiesgos: JSON.stringify(dto.metodologiaRiesgos),
          normativaLegal: JSON.stringify(dto.normativaLegal),
          resultado: resultadoEnum,
          recomendacion: dto.observacionesGenerales || null,
          actualizadoEn: new Date(),
        },
        create: {
          expedienteId: realExpedienteId,
          evaluadorId,
          principiosEticos: JSON.stringify(dto.principiosEticos),
          metodologiaRiesgos: JSON.stringify(dto.metodologiaRiesgos),
          normativaLegal: JSON.stringify(dto.normativaLegal),
          resultado: resultadoEnum,
          recomendacion: dto.observacionesGenerales || null,
        },
      });

      // 2. Registrar la Firma Digital a través de FirmaService (con hash SHA-256 y metadatos)
      const firmaRegistrada = await this.firmaService.registrarFirma(
        evaluacion.id,
        evaluadorId,
        dto.firma,
        auditoria,
        tx,
      );

      // 3. Registrar auditoría legal en 'historial'
      await tx.historial.create({
        data: {
          entidad: 'EVALUACION',
          entidadId: evaluacion.id,
          evento: 'EVALUACION_COMPLETADA',
          descripcion: `Evaluación de Anexo N°9 completada con dictamen: ${dto.dictamen}`,
          usuarioId: evaluadorId,
          expedienteId: realExpedienteId,
          metadata: {
            secciones: ['2.1', '2.2', '2.3', 'RECOMENDACIONES', 'FIRMAS'],
            dictamen: dto.dictamen,
            firmaId: firmaRegistrada.id,
            hashSha256: firmaRegistrada.hashSha256,
            firmadoEn: dto.firma.firmadoEn || new Date().toISOString(),
          },
        },
      });

      // 4. Sincronizar en 'sesiones_votacion' si existe una sesión abierta
      const sesion = await tx.sesionVotacion.findUnique({
        where: { expedienteId: realExpedienteId },
      });

      if (sesion && sesion.documentoJson) {
        const docJson = sesion.documentoJson as any;
        const votos: any[] = Array.isArray(docJson.votos) ? docJson.votos : [];

        const nuevoVoto = {
          evaluadorId,
          veredicto: this.mapearVeredicto(dto.dictamen),
          tieneObservacionesDocumentales: !!(
            dto.observacionesGenerales && dto.observacionesGenerales.trim().length > 0
          ),
          observaciones: dto.observacionesGenerales || '',
          fechaVoto: new Date().toISOString(),
        };

        const idxExistente = votos.findIndex((v) => v.evaluadorId === evaluadorId);
        if (idxExistente >= 0) {
          votos[idxExistente] = nuevoVoto;
        } else {
          votos.push(nuevoVoto);
        }

        docJson.votos = votos;
        if (docJson.progreso) {
          docJson.progreso.totalRecibidos = votos.length;
        }

        await tx.sesionVotacion.update({
          where: { expedienteId: realExpedienteId },
          data: {
            documentoJson: docJson,
            actualizadoEn: new Date(),
          },
        });
      }

      // 5. Consumir el token de evaluación para prevenir doble votación
      this.tokenService.marcarComoConsumido(tokenJti);

      return {
        ok: true,
        mensaje: 'Evaluación y firma registradas exitosamente.',
        evaluacionId: evaluacion.id,
        dictamen: dto.dictamen,
      };
    });
  }

  private mapearResultado(dictamen: string): ResultadoEvaluacion {
    switch (dictamen.toLowerCase()) {
      case 'aprobado':
        return ResultadoEvaluacion.APROBADO;
      case 'aprobado_observaciones':
        return ResultadoEvaluacion.APROBADO_CON_OBSERVACIONES;
      case 'no_aprobado':
        return ResultadoEvaluacion.NO_APROBADO;
      default:
        return ResultadoEvaluacion.APROBADO_CON_OBSERVACIONES;
    }
  }

  private mapearVeredicto(dictamen: string): string {
    switch (dictamen.toLowerCase()) {
      case 'aprobado':
        return 'Aprobado';
      case 'aprobado_observaciones':
        return 'AprobadoConObservaciones';
      case 'no_aprobado':
        return 'NoAprobado';
      default:
        return 'AprobadoConObservaciones';
    }
  }
}
