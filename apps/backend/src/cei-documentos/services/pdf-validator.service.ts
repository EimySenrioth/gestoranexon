import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

export interface ValidacionPdfResultado {
  esValido: boolean;
  totalPaginas: number;
  tamanioBytes: number;
  hashSha256: string;
}

@Injectable()
export class PdfValidatorService {
  private readonly logger = new Logger(PdfValidatorService.name);

  // Mínimo 10 KB, Máximo 25 MB
  private readonly MIN_BYTES = 10 * 1024;
  private readonly MAX_BYTES = 25 * 1024 * 1024;

  /**
   * Inspecciona el buffer del PDF generado para certificar integridad,
   * formato estándar (%PDF-), cálculo de páginas y hash criptográfico SHA-256.
   */
  validarBuffer(buffer: Buffer): ValidacionPdfResultado {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('El buffer del PDF generado está vacío.');
    }

    if (buffer.length < this.MIN_BYTES) {
      throw new BadRequestException(
        `El tamaño del PDF generado (${buffer.length} bytes) es anormalmente reducido para un Anexo N°9 completo.`,
      );
    }

    if (buffer.length > this.MAX_BYTES) {
      throw new BadRequestException(
        `El PDF generado excede el tamaño máximo permitido de 25 MB.`,
      );
    }

    // Comprobar cabecera estándar %PDF-
    const header = buffer.subarray(0, 5).toString('ascii');
    if (!header.startsWith('%PDF-')) {
      throw new BadRequestException(
        'El archivo generado no cuenta con la firma binaria estándar de un documento PDF (%PDF-).',
      );
    }

    // Conteo de páginas mediante coincidencia de objetos /Type /Page
    const totalPaginas = this.contarPaginas(buffer);
    if (totalPaginas < 1) {
      throw new BadRequestException(
        'El documento PDF generado no contiene páginas válidas.',
      );
    }

    const hashSha256 = createHash('sha256').update(buffer).digest('hex');

    this.logger.log(
      `PDF validado exitosamente: ${totalPaginas} páginas, ${buffer.length} bytes, SHA-256: ${hashSha256.substring(0, 12)}...`,
    );

    return {
      esValido: true,
      totalPaginas,
      tamanioBytes: buffer.length,
      hashSha256,
    };
  }

  /**
   * Conteo robusto de páginas buscando objetos "/Type /Page" excluyendo "/Type /Pages"
   */
  private contarPaginas(buffer: Buffer): number {
    try {
      const contenidoStr = buffer.toString('latin1');
      // Coincide con /Type /Page pero no con /Type /Pages
      const coincidencias = contenidoStr.match(/\/Type\s*\/Page\b(?!\s*s)/g);
      return coincidencias ? coincidencias.length : 1;
    } catch {
      return 1;
    }
  }
}

