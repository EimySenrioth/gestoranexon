import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { PrismaService } from '../../database/prisma.service.js';
import { SignatureLocatorService } from '../services/signature-locator.service.js';
import { CeiPdfGeneratorService } from '../services/cei-pdf-generator.service.js';
import { PdfValidatorService } from '../services/pdf-validator.service.js';
import type {
  Anexo9ConsolidadoDto,
} from '../dto/anexo9-consolidado.dto.js';

@Injectable()
export class GenerarAnexo9PdfUseCase {
  private readonly logger = new Logger(GenerarAnexo9PdfUseCase.name);
  private readonly anexo9Dir: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly signatureLocator: SignatureLocatorService,
    private readonly pdfGenerator: CeiPdfGeneratorService,
    private readonly pdfValidator: PdfValidatorService,
  ) {
    const baseUploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'documents');
    this.anexo9Dir = path.join(baseUploadDir, 'anexo9');
    if (!fs.existsSync(this.anexo9Dir)) {
      fs.mkdirSync(this.anexo9Dir, { recursive: true });
    }
  }

  /**
   * Orquesta la consolidación, generación en Chromium, validación criptográfica,
   * guardado en disco local y registro en base de datos PostgreSQL.
   */
  async ejecutar(expedienteId: string, sesionVotacionIdParam?: string) {
    this.logger.log(`Iniciando caso de uso: Generar Anexo N°9 para expediente ${expedienteId}`);

    // 1. Obtener expediente con relaciones
    const expediente = await this.prisma.expediente.findUnique({
      where: { id: expedienteId },
      include: {
        ticket: {
          include: {
            solicitante: true,
          },
        },
        solicitud: {
          include: {
            solicitante: true,
          },
        },
        evaluaciones: {
          include: {
            evaluador: true,
            firmas: {
              orderBy: { creadoEn: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!expediente) {
      throw new NotFoundException(`Expediente con ID ${expedienteId} no encontrado.`);
    }

    if (expediente.evaluaciones.length < 5) {
      throw new BadRequestException(
        `El expediente ${expediente.codigo} tiene solo ${expediente.evaluaciones.length} evaluaciones de las 5 requeridas.`,
      );
    }

    // 2. Obtener sesión de votación para el dictamen consolidado
    const sesion = await this.prisma.sesionVotacion.findUnique({
      where: { expedienteId: expediente.id },
    });

    const sesionVotacionId = sesionVotacionIdParam || sesion?.id || null;
    const dictamenFinal =
      sesion?.dictamenGlobal ||
      (expediente.estado === 'APROBADO'
        ? 'APROBADO'
        : expediente.estado === 'OBSERVADO'
        ? 'APROBADO CON OBSERVACIONES'
        : 'NO APROBADO');

    // 3. Localizar y validar estrictamente las 5 firmas (Regla bloqueante)
    const firmantes = await this.signatureLocator.localizarYValidarFirmas(expediente.id);

    // 4. Consolidar criterios y observaciones de las 5 evaluaciones (5 Éticos + 4 Normativos = 9 criterios)
    const { criteriosEticos, criteriosNormativa } = this.consolidarCriterios(expediente.evaluaciones);

    // 5. Preparar datos para compilación
    const solicitante =
      expediente.ticket?.solicitante || expediente.solicitud?.solicitante;
    const nombreInvestigador = solicitante
      ? `${solicitante.nombre} ${solicitante.apellido}`.trim()
      : 'Investigador No Especificado';

    const tituloProyecto =
      expediente.ticket?.titulo ||
      expediente.solicitud?.titulo ||
      `Proyecto de Investigación - Expediente ${expediente.codigo}`;

    const facultad =
      expediente.ticket?.unidadAcademica ||
      'Facultad de Ingeniería y Gestión (UNTELS)';

    const fechaDictamen = new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const datosCompilacion: any = {
      expediente: {
        id: expediente.id,
        codigo: expediente.codigo,
        tituloProyecto,
        investigadorPrincipal: nombreInvestigador,
        facultadOUnidad: facultad,
        fechaPresentacion: expediente.creadoEn.toISOString().split('T')[0],
        fechaDictamen,
      },
      sesionVotacionId: sesionVotacionId || undefined,
      dictamenFinal: dictamenFinal.toUpperCase(),
      criteriosEticos,
      criteriosNormativa,
      criterios: [...criteriosEticos, ...criteriosNormativa],
      observacionesGenerales: [],
      firmantes,
    };

    // 6. Compilar HTML y generar PDF en Puppeteer
    const pdfBuffer = await this.pdfGenerator.compilarYGenerarPdf(datosCompilacion);

    // 7. Validar el buffer resultante
    const validacion = this.pdfValidator.validarBuffer(pdfBuffer);

    // 8. Determinar versión e inmutabilidad en disco local
    const ultimaVersion = await this.prisma.expedienteDocumento.findFirst({
      where: {
        expedienteId: expediente.id,
        tipoDocumento: 'ANEXO_9',
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const proximaVersion = (ultimaVersion?.version ?? 0) + 1;
    const nombreArchivo = `Anexo9_${expediente.codigo}_v${proximaVersion}.pdf`;
    const rutaArchivoFisico = path.join(this.anexo9Dir, nombreArchivo);

    // Guardar archivo físico en disco local
    fs.writeFileSync(rutaArchivoFisico, pdfBuffer);
    this.logger.log(`Archivo físico guardado en: ${rutaArchivoFisico}`);

    const urlPublica = `/api/cei/documentos/anexo-9/${expediente.codigo}`;

    // 9. Persistencia atómica en PostgreSQL mediante Prisma
    return await this.prisma.$transaction(async (tx) => {
      const nuevoDocumento = await tx.expedienteDocumento.create({
        data: {
          expedienteId: expediente.id,
          ticketId: expediente.ticket?.id || null,
          sesionVotacionId,
          codigoExpediente: expediente.codigo,
          codigoTicket: expediente.ticket?.codigo || null,
          tipoDocumento: 'ANEXO_9',
          estado: 'VIGENTE',
          dictamenFinal: dictamenFinal.toUpperCase(),
          nombreArchivo,
          storagePath: rutaArchivoFisico,
          urlPublica,
          mimeType: 'application/pdf',
          tamanioBytes: validacion.tamanioBytes,
          totalPaginas: validacion.totalPaginas,
          hashSha256: validacion.hashSha256,
          version: proximaVersion,
          firmantesSnapshot: firmantes.map((f) => ({
            evaluadorId: f.evaluadorId,
            nombreCompleto: f.nombreCompleto,
            cargoCei: f.cargoCei,
            hashSha256: f.hashSha256,
            firmadoEn: f.firmadoEn,
          })),
          creadoPor: 'SISTEMA_CEI',
          metadata: {
            tituloProyecto,
            totalEvaluaciones: expediente.evaluaciones.length,
          },
        },
      });

      // Actualizar puntero activo en el expediente
      await tx.expediente.update({
        where: { id: expediente.id },
        data: {
          anexo9DocumentoId: nuevoDocumento.id,
          anexo9Url: urlPublica,
          anexo9GeneradoEn: new Date(),
          actualizadoEn: new Date(),
        },
      });

      // Registro inmutable en tabla historial
      await tx.historial.create({
        data: {
          entidad: 'ExpedienteDocumento',
          entidadId: nuevoDocumento.id,
          evento: 'ANEXO_9_PDF_GENERADO',
          descripcion: `Documento oficial Anexo N°9 generado y firmado para expediente ${expediente.codigo}`,
          expedienteId: expediente.id,
          metadata: {
            documentoId: nuevoDocumento.id,
            nombreArchivo,
            hashSha256: validacion.hashSha256,
            totalPaginas: validacion.totalPaginas,
            dictamenFinal: dictamenFinal.toUpperCase(),
            version: proximaVersion,
          },
        },
      });

      this.logger.log(
        `Anexo N°9 registrado exitosamente en BD (Documento ID: ${nuevoDocumento.id}, Expediente: ${expediente.codigo})`,
      );

      return {
        documento: nuevoDocumento,
        buffer: pdfBuffer,
      };
    });
  }

  /**
   * Consolida la matriz oficial de 9 criterios (5 Éticos + 4 Normativos) a partir de las 5 evaluaciones.
   */
  private consolidarCriterios(evaluaciones: any[]): {
    criteriosEticos: any[];
    criteriosNormativa: any[];
  } {
    // 5 Preguntas canónicas de Cumplimiento de Principios Éticos
    const criteriosEticosBase = [
      {
        numero: 1,
        id: 'consentimiento-informado',
        categoria: 'PRINCIPIOS_ETICOS',
        descripcion:
          'Consentimiento informado: Se informó al participante cómo van a ser utilizados sus datos y dio su consentimiento de participación. Se presentan documentos de los participantes (descripción de la participación, firmados, con DNI).',
      },
      {
        numero: 2,
        id: 'beneficencia-muestreo',
        categoria: 'PRINCIPIOS_ETICOS',
        descripcion:
          'Beneficencia en el muestreo: En el proceso de muestreo se busca checar si cometen faltas éticas, por ejemplo derechos animales (no se evalúa el proceso metodológico en sí).',
      },
      {
        numero: 3,
        id: 'conducta-responsable',
        categoria: 'PRINCIPIOS_ETICOS',
        descripcion:
          'Conducta responsable y veracidad de los datos: Faltas a privacidad. Divulgación de datasets con datos sensibles.',
      },
      {
        numero: 4,
        id: 'integridad-academica',
        categoria: 'PRINCIPIOS_ETICOS',
        descripcion:
          'Integridad académica / científica: Respeto estricto a derechos de autor, citas y patentes.',
      },
      {
        numero: 5,
        id: 'medida-seguridad-laboratorio',
        categoria: 'PRINCIPIOS_ETICOS',
        descripcion:
          'Medida de seguridad en el laboratorio: La metodología de investigación implica riesgos en las personas, animales o artefactos que se utilizarán durante la experimentación.',
      },
    ];

    // 4 Preguntas canónicas de Cumplimiento de Normativa Legal
    const criteriosNormativaBase = [
      {
        numero: 6,
        id: 'ley-universitaria',
        categoria: 'NORMATIVA_LEGAL',
        descripcion:
          'Ley Universitaria N° 30220 y Código de Ética de la Función Pública: Cumplimiento de los deberes y principios éticos de la función pública universitaria y lineamientos institucionales.',
      },
      {
        numero: 7,
        id: 'ley-datos-personales',
        categoria: 'NORMATIVA_LEGAL',
        descripcion:
          'Ley de Protección de Datos Personales (N° 29733): Garantía de confidencialidad, anonimización y debido resguardo de datos personales y sensibles de los participantes.',
      },
      {
        numero: 8,
        id: 'ley-salud',
        categoria: 'NORMATIVA_LEGAL',
        descripcion:
          'Ley General de Salud (N° 26842): Salvaguarda irrestricta de la vida, salud integral y derechos fundamentales de personas intervenidas en el estudio.',
      },
      {
        numero: 9,
        id: 'reglamento-ensayos-clinicos',
        categoria: 'NORMATIVA_LEGAL',
        descripcion:
          'Reglamento de Ensayos Clínicos (DS N° 021-2017-SA): Alineamiento a estándares vigentes de ensayos clínicos y buenas prácticas de investigación médica si involucra intervención clínica.',
      },
    ];

    const procesarLista = (lista: any[]) =>
      lista.map((c) => {
        const observaciones: Array<{ evaluadorNombre: string; cargo: string; texto: string }> = [];
        const respuestas: boolean[] = [];

        evaluaciones.forEach((ev, idx) => {
          let cumple = true;
          let obsTexto = '';

          try {
            const principios = ev.principiosEticos ? JSON.parse(ev.principiosEticos) : [];
            const normativa = ev.normativaLegal ? JSON.parse(ev.normativaLegal) : [];
            const metodologia = ev.metodologiaRiesgos ? JSON.parse(ev.metodologiaRiesgos) : [];

            const todos = [...principios, ...normativa, ...metodologia];
            const coincidencia = todos.find((item: any) => item.id === c.id);

            if (coincidencia) {
              cumple = coincidencia.cumple !== false;
              obsTexto = coincidencia.observaciones || '';
            }
          } catch {
            cumple = true;
          }

          respuestas[idx] = cumple;

          if (obsTexto && obsTexto.trim().length > 0) {
            const evaluador = ev.evaluador;
            const cargo =
              evaluador?.roles?.[0]?.rol?.nombre || `Evaluador ${idx + 1}`;
            observaciones.push({
              evaluadorNombre: `${evaluador?.nombre || ''} ${evaluador?.apellido || ''}`.trim(),
              cargo,
              texto: obsTexto.trim(),
            });
          }
        });

        return {
          ...c,
          eval1Cumple: respuestas[0] ?? true,
          eval2Cumple: respuestas[1] ?? true,
          eval3Cumple: respuestas[2] ?? true,
          eval4Cumple: respuestas[3] ?? true,
          eval5Cumple: respuestas[4] ?? true,
          observaciones,
        };
      });

    return {
      criteriosEticos: procesarLista(criteriosEticosBase),
      criteriosNormativa: procesarLista(criteriosNormativaBase),
    };
  }
}
