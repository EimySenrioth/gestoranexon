import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import fs from 'fs';
import { Anexo9ResolverService } from '../services/anexo9-resolver.service.js';
import { GenerarAnexo9PdfUseCase } from '../use-cases/generar-anexo9-pdf.use-case.js';
import { PrismaService } from '../../database/prisma.service.js';

@Controller('cei/documentos')
export class CeiDocumentosController {
  private readonly logger = new Logger(CeiDocumentosController.name);

  constructor(
    private readonly resolverService: Anexo9ResolverService,
    private readonly generarAnexo9PdfUseCase: GenerarAnexo9PdfUseCase,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Endpoint único de consulta y entrega del Anexo N°9 oficial del CEI.
   * Admite CUID del Expediente, Código de Expediente (EXP-*), CUID del Ticket o Código del Ticket (TCK-*).
   */
  @Get('anexo-9/:identifier')
  async entregarAnexo9(
    @Param('identifier') identifier: string,
    @Query('download') downloadQuery: string,
    @Query('version') versionQuery: string = 'latest',
    @Query('format') formatQuery: string = 'pdf',
    @Res() res: Response,
  ) {
    const download = downloadQuery === 'true';
    const format = (formatQuery || 'pdf').toLowerCase();

    this.logger.log(
      `Petición recibida para Anexo N°9 [Identifier: ${identifier}, format: ${format}, download: ${download}]`,
    );

    // 1. Resolver expediente y documento existente
    const { expedienteId, documento } =
      await this.resolverService.obtenerDocumento(identifier, versionQuery);

    let docFinal = documento;

    // 2. Generación Just-In-Time (Lazy) si no existe pero el expediente ya cuenta con 5 evaluaciones
    if (!docFinal) {
      const expediente = await this.prisma.expediente.findUnique({
        where: { id: expedienteId },
        include: {
          evaluaciones: true,
        },
      });

      if (expediente && expediente.evaluaciones.length >= 5) {
        this.logger.log(
          `Documento no encontrado físicamente. Disparando generación Just-In-Time para expediente ${expediente.codigo}...`,
        );
        const resultadoGen = await this.generarAnexo9PdfUseCase.ejecutar(expedienteId);
        docFinal = resultadoGen.documento as any;
      } else {
        throw new NotFoundException(
          `No existe Anexo N°9 emitido para el expediente "${identifier}" ni cuenta con las 5 evaluaciones requeridas.`,
        );
      }
    }

    if (!docFinal) {
      throw new NotFoundException(`No fue posible resolver el documento solicitado.`);
    }

    const documentoActivo = docFinal;

    // 3. Respuesta en Formato JSON (si se solicitó format=json)
    if (format === 'json') {
      return res.status(200).json({
        documentoId: documentoActivo.id,
        expedienteId: documentoActivo.expedienteId,
        codigoExpediente: documentoActivo.codigoExpediente,
        codigoTicket: documentoActivo.codigoTicket,
        sesionVotacionId: documentoActivo.sesionVotacionId,
        tipoDocumento: documentoActivo.tipoDocumento,
        estado: documentoActivo.estado,
        dictamenFinal: documentoActivo.dictamenFinal,
        nombreArchivo: documentoActivo.nombreArchivo,
        mimeType: documentoActivo.mimeType,
        tamanioBytes: documentoActivo.tamanioBytes,
        totalPaginas: documentoActivo.totalPaginas,
        hashSha256: documentoActivo.hashSha256,
        version: documentoActivo.version,
        urlPublica: documentoActivo.urlPublica,
        generadoEn: documentoActivo.creadoEn,
        firmantesSnapshot: documentoActivo.firmantesSnapshot,
      });
    }

    let storagePath = documentoActivo.storagePath;
    let nombreArchivo = documentoActivo.nombreArchivo;
    let idDoc = documentoActivo.id;
    let hashDoc = documentoActivo.hashSha256;
    let versionDoc = documentoActivo.version;
    let creadoEnDoc = documentoActivo.creadoEn;
    let paginasDoc = documentoActivo.totalPaginas;

    // 4. Verificación de archivo físico en disco local
    if (!fs.existsSync(storagePath)) {
      this.logger.warn(
        `El archivo físico ${storagePath} no existe en disco. Re-generando...`,
      );
      const resultadoGen = await this.generarAnexo9PdfUseCase.ejecutar(documentoActivo.expedienteId);
      storagePath = resultadoGen.documento.storagePath;
      nombreArchivo = resultadoGen.documento.nombreArchivo;
      idDoc = resultadoGen.documento.id;
      hashDoc = resultadoGen.documento.hashSha256;
      versionDoc = resultadoGen.documento.version;
      creadoEnDoc = resultadoGen.documento.creadoEn;
      paginasDoc = resultadoGen.documento.totalPaginas;
    }

    const fileBuffer = fs.readFileSync(storagePath);

    // 5. Encabezados de metadata técnica integrados en la respuesta binaria
    const disposition = download ? 'attachment' : 'inline';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${nombreArchivo}"`,
      'Content-Length': fileBuffer.length.toString(),
      'X-Documento-Id': idDoc,
      'X-Hash-Sha256': hashDoc,
      'X-Documento-Version': versionDoc.toString(),
      'X-Generado-At': creadoEnDoc.toISOString(),
      'X-Total-Paginas': paginasDoc.toString(),
    });

    return res.status(200).send(fileBuffer);
  }
}
