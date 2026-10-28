import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EvaluationTokenService } from './evaluation-token.service.js';
import { CompletarAnexo9Dto, GuardarBorradorAnexoDto } from '../dto/index.js';
import { ResultadoEvaluacion } from '@prisma/client';

@Injectable()
export class AnexoEvaluacionService {
  private readonly logger = new Logger(AnexoEvaluacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: EvaluationTokenService,
  ) {}

  /**
   * Obtiene el estado actual del Anexo N°9 (Borrador previo o versión firmada).
   */
  async obtenerEstadoAnexo(expedienteId: string, evaluadorId: string) {
    const evaluacion = await this.prisma.evaluacion.findFirst({
      where: {
        expedienteId,
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
              firmadoPor: evaluacion.firmas[0].firmadoPor,
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
    this.logger.log(`Guardando borrador de Anexo N°9 para expediente ${dto.expedienteId}`);

    const dictamenEnum = dto.dictamen ? this.mapearResultado(dto.dictamen) : undefined;

    const evaluacion = await this.prisma.evaluacion.upsert({
      where: {
        expedienteId_evaluadorId: {
          expedienteId: dto.expedienteId,
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
        expedienteId: dto.expedienteId,
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
        expedienteId: dto.expedienteId,
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
  ) {
    this.logger.log(
      `Completando formalmente evaluación de Anexo N°9 para expediente ${dto.expedienteId}`,
    );

    const resultadoEnum = this.mapearResultado(dto.dictamen);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Upsert en la tabla 'evaluaciones'
      const evaluacion = await tx.evaluacion.upsert({
        where: {
          expedienteId_evaluadorId: {
            expedienteId: dto.expedienteId,
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
          expedienteId: dto.expedienteId,
          evaluadorId,
          principiosEticos: JSON.stringify(dto.principiosEticos),
          metodologiaRiesgos: JSON.stringify(dto.metodologiaRiesgos),
          normativaLegal: JSON.stringify(dto.normativaLegal),
          resultado: resultadoEnum,
          recomendacion: dto.observacionesGenerales || null,
        },
      });

      // 2. Registrar la Firma Digital
      await tx.firma.create({
        data: {
          evaluacionId: evaluacion.id,
          firmadoPor: evaluadorId,
          firma: dto.firma.firmaDataUrl,
        },
      });

      // 3. Registrar auditoría legal en 'historial'
      await tx.historial.create({
        data: {
          entidad: 'EVALUACION',
          entidadId: evaluacion.id,
          evento: 'EVALUACION_COMPLETADA',
          descripcion: `Evaluación de Anexo N°9 completada con dictamen: ${dto.dictamen}`,
          usuarioId: evaluadorId,
          expedienteId: dto.expedienteId,
          metadata: {
            secciones: ['2.1', '2.2', '2.3', 'RECOMENDACIONES', 'FIRMAS'],
            dictamen: dto.dictamen,
            firmadoEn: dto.firma.firmadoEn || new Date().toISOString(),
          },
        },
      });

      // 4. Sincronizar en 'sesiones_votacion' si existe una sesión abierta
      const sesion = await tx.sesionVotacion.findUnique({
        where: { expedienteId: dto.expedienteId },
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
          where: { expedienteId: dto.expedienteId },
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
