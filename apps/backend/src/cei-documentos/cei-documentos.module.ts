import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module.js';
import { CeiDocumentosController } from './controllers/cei-documentos.controller.js';
import {
  SignatureLocatorService,
  PdfValidatorService,
  Anexo9ResolverService,
  CeiPdfGeneratorService,
} from './services/index.js';
import { GenerarAnexo9PdfUseCase } from './use-cases/generar-anexo9-pdf.use-case.js';

@Module({
  imports: [PrismaModule],
  controllers: [CeiDocumentosController],
  providers: [
    SignatureLocatorService,
    PdfValidatorService,
    Anexo9ResolverService,
    CeiPdfGeneratorService,
    GenerarAnexo9PdfUseCase,
  ],
  exports: [
    GenerarAnexo9PdfUseCase,
    Anexo9ResolverService,
    SignatureLocatorService,
  ],
})
export class CeiDocumentosModule {}

