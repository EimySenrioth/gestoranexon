import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  NotImplementedException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { DocumentManagementService } from './documentmanagement.service.js';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import {
  JwtAuthGuard,
  type AuthenticatedUser,
} from '../common/guards/index.js';
import { CurrentUser } from '../common/decorators/index.js';


@Controller('api/v1/documents')
export class DocumentManagementController {
  constructor(
    private readonly documentManagementService: DocumentManagementService,
  ) {}

  /**
   * Sube o reemplaza (R1) un documento adjunto a un ticket en BORRADOR.
   */
  @Post('upload/ticket/:ticketId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('ticketId') ticketId: string,
    @UploadedFile()
    file: { originalname: string; mimetype?: string; size: number; buffer: Buffer },
    @Body() dto: UploadDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentManagementService.uploadTicketDocument(
      ticketId,
      file,
      dto.tipoDocumental,
      userId,
    );
  }

  /**
   * Descarga segura de un documento.
   */
  @Get(':documentId/download')
  @UseGuards(JwtAuthGuard)
  async downloadDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const docInfo = await this.documentManagementService.getDocumentForDownload(
      documentId,
      user,
    );

    res.setHeader('Content-Type', docInfo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(docInfo.nombreOriginal)}"`,
    );

    return res.sendFile(docInfo.filePath);
  }

  /**
   * Elimina un documento adjunto mientras el ticket esté en BORRADOR.
   */
  @Delete(':documentId')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  deleteDocument(
    @Param('documentId') documentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentManagementService.deleteDocument(documentId, userId);
  }

  /**
   * Stub de actualización de estado documental (501).
   */
  @Patch(':documentId/status')
  @UseGuards(JwtAuthGuard)
  updateDocumentStatus() {
    throw new NotImplementedException(
      'La calificación individual de documentos está reservada para el sistema CEI en fase posterior.',
    );
  }
}
