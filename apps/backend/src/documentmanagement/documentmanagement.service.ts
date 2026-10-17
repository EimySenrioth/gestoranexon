import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard.js';
import { ROLES_CEI } from '../common/constants/roles.constants.js';
import { esErrorConexionBD } from '../common/utils/db-error.util.js';
import { MOCK_DEV_TICKETS } from '../ticketmanager/mocks/ticket-dev.store.js';


@Injectable()
export class DocumentManagementService {
  private readonly logger = new Logger(DocumentManagementService.name);
  private readonly uploadDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.uploadDir =
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Sube un documento asociado a un ticket en estado BORRADOR:
   * - Verifica que el usuario sea el dueño del ticket y esté en BORRADOR.
   * - Calcula SHA-256 y persiste el archivo en disco.
   * - R1: Si ya existe un documento vigente para el mismo tipoDocumental,
   *   lo marca como REEMPLAZADO e incrementa la versión en una transacción atómica.
   */
  async uploadTicketDocument(
    ticketId: string,
    file: { originalname: string; mimetype?: string; size: number; buffer: Buffer },
    tipoDocumentalRaw: string,
    userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Debe enviar un archivo en el campo "file"');
    }

    const tipoDocumental = tipoDocumentalRaw.trim().toUpperCase();

    // 1. Verificación previa de pertenencia y estado
    try {
      const ticket = await this.prisma.ticket.findFirst({
        where: { id: ticketId, solicitanteId: userId },
        select: { estado: true },
      });

      if (!ticket) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      if (ticket.estado !== 'BORRADOR') {
        throw new ConflictException(
          `No se pueden adjuntar documentos a una solicitud en estado ${ticket.estado}. Solo permitido en BORRADOR.`,
        );
      }

      // 2. Cálculo de SHA-256 y persistencia en disco
      const hashSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
      const safeExt = path.extname(file.originalname).slice(0, 10);
      const uniqueFileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}${safeExt}`;
      const storagePath = path.join(this.uploadDir, uniqueFileName);

      await fs.promises.writeFile(storagePath, file.buffer);

      // 3. Transacción atómica R1: reemplazo de versión previa
      return await this.prisma.$transaction(async (tx) => {
        const ticketBloqueado = await tx.ticket.findFirst({
          where: { id: ticketId, solicitanteId: userId, estado: 'BORRADOR' },
          select: { id: true },
        });

        if (!ticketBloqueado) {
          await fs.promises.unlink(storagePath).catch(() => {});
          throw new ConflictException(
            'La solicitud ya no se encuentra en estado BORRADOR',
          );
        }

        const docPrevio = await tx.ticketDocumento.findFirst({
          where: {
            ticketId,
            tipoDocumental,
            estado: { not: 'REEMPLAZADO' },
          },
          orderBy: { version: 'desc' },
        });

        let version = 1;
        if (docPrevio) {
          version = docPrevio.version + 1;
          await tx.ticketDocumento.update({
            where: { id: docPrevio.id },
            data: { estado: 'REEMPLAZADO' },
          });
        }

        const nuevoDoc = await tx.ticketDocumento.create({
          data: {
            ticketId,
            nombreOriginal: file.originalname.slice(0, 255),
            nombreArchivo: uniqueFileName,
            tipoDocumental,
            mimeType: (file.mimetype || 'application/octet-stream').slice(0, 100),
            tamanioBytes: file.size,
            hashSha256,
            storagePath,
            version,
            estado: 'PENDIENTE_VALIDACION',
            subidoPorId: userId,
          },
        });

        return nuevoDoc;
      });
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Subiendo documento en memoria.`);

      const ticket = MOCK_DEV_TICKETS.get(ticketId);
      if (!ticket || ticket.solicitanteId !== userId) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      if (ticket.estado !== 'BORRADOR') {
        throw new ConflictException(
          `No se pueden adjuntar documentos a una solicitud en estado ${ticket.estado}. Solo permitido en BORRADOR.`,
        );
      }

      const hashSha256 = crypto.createHash('sha256').update(file.buffer).digest('hex');
      const safeExt = path.extname(file.originalname).slice(0, 10);
      const uniqueFileName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}${safeExt}`;
      const storagePath = path.join(this.uploadDir, uniqueFileName);

      await fs.promises.writeFile(storagePath, file.buffer);

      if (!ticket.documentos) {
        ticket.documentos = [];
      }

      // R1: Reemplazar versión previa
      const docPrevio = ticket.documentos.find(
        (d: any) => d.tipoDocumental === tipoDocumental && d.estado !== 'REEMPLAZADO',
      );

      let version = 1;
      if (docPrevio) {
        version = docPrevio.version + 1;
        docPrevio.estado = 'REEMPLAZADO';
      }

      const nuevoDoc = {
        id: `doc_mock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        ticketId,
        nombreOriginal: file.originalname.slice(0, 255),
        nombreArchivo: uniqueFileName,
        tipoDocumental,
        mimeType: (file.mimetype || 'application/octet-stream').slice(0, 100),
        tamanioBytes: file.size,
        hashSha256,
        storagePath,
        version,
        estado: 'PENDIENTE_VALIDACION',
        subidoPorId: userId,
        creadoEn: new Date(),
        actualizadoEn: new Date(),
      };

      ticket.documentos.push(nuevoDoc);
      ticket.actualizadoEn = new Date();
      MOCK_DEV_TICKETS.set(ticketId, ticket);

      return nuevoDoc;
    }
  }

  /**
   * Obtiene la ruta física y metadatos para descargar un documento.
   * Valida permisos: dueño del trámite, o miembro del CEI si el trámite fue enviado.
   */
  async getDocumentForDownload(documentId: string, user: AuthenticatedUser) {
    try {
      const doc = await this.prisma.ticketDocumento.findUnique({
        where: { id: documentId },
        include: {
          ticket: {
            select: {
              solicitanteId: true,
              estado: true,
            },
          },
        },
      });

      if (!doc) {
        throw new NotFoundException('Documento no encontrado');
      }

      const isOwner = doc.ticket.solicitanteId === user.id;
      const isCei = user.roles.some((r) =>
        ROLES_CEI.includes(r.toUpperCase() as any),
      );

      if (isOwner) {
        return this.resolverArchivo(doc);
      }

      if (isCei && doc.ticket.estado === 'EXPEDIENTE_GENERADO') {
        return this.resolverArchivo(doc);
      }

      throw new ForbiddenException('No tiene permisos para acceder a este documento');
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Buscando documento en memoria.`);

      let encontrado: any = null;
      let ticketEncontrado: any = null;

      for (const ticket of MOCK_DEV_TICKETS.values()) {
        const d = (ticket.documentos || []).find((x: any) => x.id === documentId);
        if (d) {
          encontrado = d;
          ticketEncontrado = ticket;
          break;
        }
      }

      if (!encontrado) {
        throw new NotFoundException('Documento no encontrado');
      }

      const isOwner = ticketEncontrado.solicitanteId === user.id;
      const isCei = user.roles.some((r) =>
        ROLES_CEI.includes(r.toUpperCase() as any),
      );

      if (isOwner || (isCei && ticketEncontrado.estado === 'EXPEDIENTE_GENERADO')) {
        return this.resolverArchivo(encontrado);
      }

      throw new ForbiddenException('No tiene permisos para acceder a este documento');
    }
  }

  /**
   * Elimina un documento adjunto mientras el ticket esté en BORRADOR.
   */
  async deleteDocument(documentId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const doc = await tx.ticketDocumento.findUnique({
          where: { id: documentId },
          include: {
            ticket: { select: { solicitanteId: true, estado: true } },
          },
        });

        if (!doc) {
          throw new NotFoundException('Documento no encontrado');
        }

        if (doc.ticket.solicitanteId !== userId) {
          throw new ForbiddenException('No tiene permisos para eliminar este documento');
        }

        if (doc.ticket.estado !== 'BORRADOR') {
          throw new ConflictException(
            `No se pueden eliminar documentos de una solicitud en estado ${doc.ticket.estado}.`,
          );
        }

        await tx.ticketDocumento.delete({ where: { id: documentId } });

        // Intento no bloqueante de eliminar archivo físico
        if (fs.existsSync(doc.storagePath)) {
          await fs.promises.unlink(doc.storagePath).catch(() => {});
        }

        return { id: documentId, eliminado: true };
      });
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Eliminando documento en memoria.`);

      let ticketOwner: any = null;
      let docIndex = -1;
      let targetDoc: any = null;

      for (const ticket of MOCK_DEV_TICKETS.values()) {
        const idx = (ticket.documentos || []).findIndex((x: any) => x.id === documentId);
        if (idx !== -1) {
          ticketOwner = ticket;
          docIndex = idx;
          targetDoc = ticket.documentos[idx];
          break;
        }
      }

      if (!targetDoc) {
        throw new NotFoundException('Documento no encontrado');
      }

      if (ticketOwner.solicitanteId !== userId) {
        throw new ForbiddenException('No tiene permisos para eliminar este documento');
      }

      if (ticketOwner.estado !== 'BORRADOR') {
        throw new ConflictException(
          `No se pueden eliminar documentos de una solicitud en estado ${ticketOwner.estado}.`,
        );
      }

      ticketOwner.documentos.splice(docIndex, 1);
      ticketOwner.actualizadoEn = new Date();
      MOCK_DEV_TICKETS.set(ticketOwner.id, ticketOwner);

      if (fs.existsSync(targetDoc.storagePath)) {
        await fs.promises.unlink(targetDoc.storagePath).catch(() => {});
      }

      return { id: documentId, eliminado: true };
    }
  }

  private resolverArchivo(doc: {
    nombreOriginal: string;
    mimeType: string;
    storagePath: string;
    tamanioBytes: number;
  }) {
    if (!fs.existsSync(doc.storagePath)) {
      throw new NotFoundException('El archivo físico no fue encontrado en el servidor');
    }

    return {
      filePath: doc.storagePath,
      nombreOriginal: doc.nombreOriginal,
      mimeType: doc.mimeType,
      tamanioBytes: doc.tamanioBytes,
    };
  }
}
