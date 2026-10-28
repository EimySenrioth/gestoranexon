import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import {
  SesionVotacionJson,
  VotoEvaluadorData,
  CriteriosAnexoData,
} from '../domain/models/sesion-votacion.model.js';
import {
  calcularReglasVotacion,
  TOTAL_EVALUADORES,
} from '../domain/rules/reglas-votacion.js';
import {
  EmitirVotoDto,
  EmitirDictamenPresidenteDto,
  CrearSesionVotacionDto,
} from '../dto/index.js';

@Injectable()
export class VotacionesService {
  private readonly logger = new Logger(VotacionesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Inicializa una sesión de votación para un anexo y sus 5 evaluadores asignados.
   */
  async iniciarSesion(dto: CrearSesionVotacionDto, creadorId: string) {
    this.logger.log(`Iniciando sesión de votación para expediente ${dto.expedienteId}`);

    return await this.prisma.$transaction(async (tx) => {
      // Verificar existencia del expediente
      const expediente = await tx.expediente.findUnique({
        where: { id: dto.expedienteId },
      });

      if (!expediente) {
        throw new NotFoundException(`El expediente ${dto.expedienteId} no existe.`);
      }

      // Verificar si ya existe una sesión activa
      const sesionExistente = await tx.sesionVotacion.findUnique({
        where: { expedienteId: dto.expedienteId },
      });

      if (sesionExistente) {
        throw new ConflictException(
          `Ya existe una sesión de votación registrada para el expediente ${dto.expedienteId}.`,
        );
      }

      // Criterios base por defecto si no vienen en el DTO
      const criteriosDefault: CriteriosAnexoData = {
        principiosEticos: dto.criteriosAnexo?.principiosEticos?.map((c) => ({
          id: c.id,
          cumple: c.cumple ?? true,
          observaciones: c.observaciones ?? '',
        })) ?? [
          { id: 'consentimiento-informado', cumple: true, observaciones: '' },
          { id: 'beneficencia-muestreo', cumple: true, observaciones: '' },
          { id: 'conducta-responsable', cumple: true, observaciones: '' },
          { id: 'integridad-academica', cumple: true, observaciones: '' },
          { id: 'medida-seguridad-laboratorio', cumple: true, observaciones: '' },
        ],
        normativaLegal: dto.criteriosAnexo?.normativaLegal?.map((c) => ({
          id: c.id,
          cumple: c.cumple ?? true,
          observaciones: c.observaciones ?? '',
        })) ?? [
          { id: 'ley-universitaria', cumple: true, observaciones: '' },
          { id: 'ley-datos-personales', cumple: true, observaciones: '' },
          { id: 'ley-salud', cumple: true, observaciones: '' },
          { id: 'reglamento-ensayos-clinicos', cumple: true, observaciones: '' },
        ],
      };

      const docJson: SesionVotacionJson = {
        anexoId: dto.anexoId,
        expedienteId: dto.expedienteId,
        version: 1,
        evaluadoresAsignados: dto.evaluadoresAsignados,
        presidenteCeiId: dto.presidenteCeiId,
        criteriosAnexo: criteriosDefault,
        votos: [],
        progreso: {
          totalEsperados: TOTAL_EVALUADORES,
          totalRecibidos: 0,
          cierreAnticipadoDisponible: false,
        },
        dictamenGlobal: {
          resultado: 'EnEvaluacion',
          reglaAplicada: null,
          totalAprobado: 0,
          totalAprobadoConObs: 0,
          totalNoAprobado: 0,
          fechaCalculo: null,
        },
        dictamenPresidenteCei: {
          presidenteId: dto.presidenteCeiId,
          resultado: null,
          fechaEmision: null,
        },
        estado: 'EnProgreso',
        fechaCierre: null,
      };

      const sesion = await tx.sesionVotacion.create({
        data: {
          expedienteId: dto.expedienteId,
          estado: 'EnProgreso',
          dictamenGlobal: 'EnEvaluacion',
          documentoJson: docJson as any,
          version: 1,
        },
      });

      // Registro de auditoría
      await tx.historial.create({
        data: {
          entidad: 'SesionVotacion',
          entidadId: sesion.id,
          evento: 'SESION_VOTACION_INICIADA',
          descripcion: `Sesión de votación iniciada para anexo ${dto.anexoId}`,
          usuarioId: creadorId,
          expedienteId: dto.expedienteId,
          metadata: {
            anexoId: dto.anexoId,
            evaluadoresAsignados: dto.evaluadoresAsignados,
            presidenteCeiId: dto.presidenteCeiId,
          },
        },
      });

      return sesion;
    });
  }

  /**
   * VOTO CIEGO: Retorna únicamente el conteo de progreso para la vista pública en tiempo real.
   */
  async obtenerProgresoAnonimo(sesionId: string) {
    const sesion = await this.prisma.sesionVotacion.findUnique({
      where: { id: sesionId },
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión de votación ${sesionId} no encontrada.`);
    }

    const doc = sesion.documentoJson as unknown as SesionVotacionJson;

    return {
      sesionId: sesion.id,
      expedienteId: sesion.expedienteId,
      estado: sesion.estado,
      totalRecibidos: doc.progreso.totalRecibidos,
      totalEsperados: doc.progreso.totalEsperados,
      cierreAnticipadoDisponible: doc.progreso.cierreAnticipadoDisponible,
    };
  }

  /**
   * Retorna el documento JSON consolidado completo.
   */
  async obtenerResultadoCompleto(sesionId: string, usuarioId: string) {
    const sesion = await this.prisma.sesionVotacion.findUnique({
      where: { id: sesionId },
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión de votación ${sesionId} no encontrada.`);
    }

    const doc = sesion.documentoJson as unknown as SesionVotacionJson;

    // Solo se expone si está cerrada o si el consultante es el Presidente del CEI
    if (sesion.estado === 'EnProgreso' && doc.presidenteCeiId !== usuarioId) {
      throw new ForbiddenException(
        'El resultado consolidado solo está disponible una vez concluida la votación (política de voto ciego).',
      );
    }

    return doc;
  }

  /**
   * Emite el voto individual de un evaluador asignado.
   */
  async registrarVoto(sesionId: string, usuarioId: string, dto: EmitirVotoDto) {
    return await this.prisma.$transaction(async (tx) => {
      const sesion = await tx.sesionVotacion.findUnique({
        where: { id: sesionId },
      });

      if (!sesion) {
        throw new NotFoundException(`Sesión de votación ${sesionId} no encontrada.`);
      }

      if (sesion.estado !== 'EnProgreso') {
        throw new BadRequestException('La sesión de votación ya se encuentra cerrada.');
      }

      const doc = sesion.documentoJson as unknown as SesionVotacionJson;

      // 1. Validar que el usuario sea uno de los evaluadores asignados
      if (!doc.evaluadoresAsignados.includes(usuarioId)) {
        throw new ForbiddenException('El usuario no está asignado como evaluador de esta sesión.');
      }

      // 2. Validar que no haya votado previamente (1 voto por evaluador)
      const yaVoto = doc.votos.some((v) => v.evaluadorId === usuarioId);
      if (yaVoto) {
        throw new ConflictException('El evaluador ya ha registrado su voto en esta sesión.');
      }

      // 3. Registrar el voto en el documento JSON
      const nuevoVoto: VotoEvaluadorData = {
        evaluadorId: usuarioId,
        veredicto: dto.veredicto,
        tieneObservacionesDocumentales: dto.tieneObservacionesDocumentales,
        observaciones: dto.observaciones ?? '',
        fechaVoto: new Date().toISOString(),
      };
      doc.votos.push(nuevoVoto);
      doc.progreso.totalRecibidos = doc.votos.length;

      // 4. Ejecutar el Motor de Reglas puro
      const calculo = calcularReglasVotacion(
        doc.votos.map((v) => ({
          evaluadorId: v.evaluadorId,
          veredicto: v.veredicto,
          tieneObservacionesDocumentales: v.tieneObservacionesDocumentales,
        })),
        doc.dictamenPresidenteCei.resultado ?? undefined,
      );

      // Actualizar metadata de conteo
      doc.dictamenGlobal.totalAprobado = calculo.totalAprobados;
      doc.dictamenGlobal.totalAprobadoConObs = calculo.totalAprobadosConObs;
      doc.dictamenGlobal.totalNoAprobado = calculo.totalNoAprobados;
      doc.dictamenGlobal.reglaAplicada = calculo.motivoRegla;
      doc.dictamenGlobal.fechaCalculo = new Date().toISOString();
      doc.progreso.cierreAnticipadoDisponible = calculo.puedeCerrarAnticipadamente;

      let sesionCerrada = false;
      let nuevoEstado = sesion.estado;

      if (calculo.puedeCerrarAnticipadamente) {
        nuevoEstado = 'CerradaAnticipada';
        doc.estado = 'CerradaAnticipada';
        doc.dictamenGlobal.resultado = calculo.dictamen;
        doc.fechaCierre = new Date().toISOString();
        sesionCerrada = true;
      } else if (doc.votos.length === TOTAL_EVALUADORES) {
        nuevoEstado = 'CerradaCompleta';
        doc.estado = 'CerradaCompleta';
        doc.dictamenGlobal.resultado = calculo.dictamen;
        doc.fechaCierre = new Date().toISOString();
        sesionCerrada = true;
      }

      // 5. Persistir en la sesión de votación
      await tx.sesionVotacion.update({
        where: { id: sesionId },
        data: {
          estado: nuevoEstado,
          dictamenGlobal: doc.dictamenGlobal.resultado,
          documentoJson: doc as any,
          version: { increment: 1 },
        },
      });

      // 6. Si se cerró la sesión, propagar atómicamente a Ticket, Expediente y Evaluaciones
      if (sesionCerrada) {
        const estadoExpedienteMap: Record<string, string> = {
          Aprobado: 'APROBADO',
          AprobadoConObservaciones: 'OBSERVADO',
          NoAprobado: 'RECHAZADO',
        };

        const nuevoEstadoExpediente = estadoExpedienteMap[doc.dictamenGlobal.resultado];

        if (nuevoEstadoExpediente) {
          // Actualizar Expediente
          await tx.expediente.update({
            where: { id: sesion.expedienteId },
            data: { estado: nuevoEstadoExpediente as any },
          });

          // Actualizar Ticket vinculado
          await tx.ticket.updateMany({
            where: { expedienteId: sesion.expedienteId },
            data: {
              resultadoEvaluacionExterna: doc.dictamenGlobal.resultado,
              calificacionExternaJson: doc as any,
              fechaRecepcionEvaluacion: new Date(),
            },
          });
        }

        // Actualizar filas en tabla evaluaciones
        for (const v of doc.votos) {
          const resultadoEvaluacionMap: Record<string, string> = {
            Aprobado: 'APROBADO',
            AprobadoConObservaciones: 'APROBADO_CON_OBSERVACIONES',
            NoAprobado: 'NO_APROBADO',
          };

          await tx.evaluacion.updateMany({
            where: {
              expedienteId: sesion.expedienteId,
              evaluadorId: v.evaluadorId,
            },
            data: {
              resultado: resultadoEvaluacionMap[v.veredicto] as any,
              recomendacion: v.observaciones,
            },
          });
        }
      }

      // 7. Auditoría inmutable en tabla historial
      await tx.historial.create({
        data: {
          entidad: 'SesionVotacion',
          entidadId: sesion.id,
          evento: 'VOTO_REGISTRADO',
          descripcion: `Voto emitido por evaluador ${usuarioId}`,
          usuarioId: usuarioId,
          expedienteId: sesion.expedienteId,
          metadata: {
            veredicto: dto.veredicto,
            tieneObservacionesDocumentales: dto.tieneObservacionesDocumentales,
            totalEmitidos: doc.votos.length,
            cierreAnticipado: calculo.puedeCerrarAnticipadamente,
            sesionCerrada,
          },
        },
      });

      return {
        sesionCerrada,
        totalVotosActuales: doc.votos.length,
        totalEsperados: TOTAL_EVALUADORES,
        dictamen: doc.dictamenGlobal.resultado,
        documentoConsolidado: sesionCerrada ? doc : null,
      };
    });
  }

  /**
   * Registra el veredicto institucional del Presidente del CEI con fechaEmision.
   */
  async registrarDictamenPresidente(
    sesionId: string,
    presidenteId: string,
    dto: EmitirDictamenPresidenteDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const sesion = await tx.sesionVotacion.findUnique({
        where: { id: sesionId },
      });

      if (!sesion) {
        throw new NotFoundException(`Sesión de votación ${sesionId} no encontrada.`);
      }

      const doc = sesion.documentoJson as unknown as SesionVotacionJson;

      if (doc.presidenteCeiId !== presidenteId) {
        throw new ForbiddenException('Solo el Presidente del CEI asignado puede emitir este dictamen.');
      }

      const fechaEmision = new Date().toISOString();

      doc.dictamenPresidenteCei = {
        presidenteId,
        resultado: dto.resultado,
        fechaEmision,
      };

      // Si la sesión estaba en empate esperando dirimencia, se recalcula el dictamen global
      if (doc.dictamenGlobal.resultado === 'EmpateRequierePresidente') {
        const calculo = calcularReglasVotacion(
          doc.votos.map((v) => ({
            evaluadorId: v.evaluadorId,
            veredicto: v.veredicto,
            tieneObservacionesDocumentales: v.tieneObservacionesDocumentales,
          })),
          dto.resultado,
        );

        doc.dictamenGlobal.resultado = calculo.dictamen;
        doc.dictamenGlobal.reglaAplicada = calculo.motivoRegla;
      }

      await tx.sesionVotacion.update({
        where: { id: sesionId },
        data: {
          dictamenPresidente: dto.resultado,
          dictamenGlobal: doc.dictamenGlobal.resultado,
          documentoJson: doc as any,
          version: { increment: 1 },
        },
      });

      await tx.historial.create({
        data: {
          entidad: 'SesionVotacion',
          entidadId: sesion.id,
          evento: 'DICTAMEN_PRESIDENTE_EMITIDO',
          descripcion: `Presidente CEI emitió dictamen formal: ${dto.resultado}`,
          usuarioId: presidenteId,
          expedienteId: sesion.expedienteId,
          metadata: {
            resultado: dto.resultado,
            fechaEmision,
          },
        },
      });

      return doc.dictamenPresidenteCei;
    });
  }

  /**
   * Consulta los eventos de auditoría registrados en la tabla historial para esta sesión.
   */
  async obtenerHistorialEventos(sesionId: string) {
    return await this.prisma.historial.findMany({
      where: {
        entidad: 'SesionVotacion',
        entidadId: sesionId,
      },
      orderBy: { creadoEn: 'asc' },
    });
  }
}
