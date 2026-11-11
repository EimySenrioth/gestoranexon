import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import Handlebars from 'handlebars';
import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Anexo9ConsolidadoDto } from '../dto/anexo9-consolidado.dto.js';

@Injectable()
export class CeiPdfGeneratorService {
  private readonly logger = new Logger(CeiPdfGeneratorService.name);
  private readonly templatePath: string;

  constructor() {
    // Resolver ruta absoluta del template (en dist o fallback en src)
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const distTemplate = path.resolve(currentDir, '..', 'templates', 'anexo-9-untels.hbs');
    const srcTemplate = path.resolve(
      process.cwd(),
      'src',
      'cei-documentos',
      'templates',
      'anexo-9-untels.hbs',
    );
    const rootSrcTemplate = path.resolve(
      process.cwd(),
      'apps',
      'backend',
      'src',
      'cei-documentos',
      'templates',
      'anexo-9-untels.hbs',
    );

    if (fs.existsSync(distTemplate)) {
      this.templatePath = distTemplate;
    } else if (fs.existsSync(srcTemplate)) {
      this.templatePath = srcTemplate;
    } else if (fs.existsSync(rootSrcTemplate)) {
      this.templatePath = rootSrcTemplate;
    } else {
      this.templatePath = distTemplate;
    }
  }

  /**
   * Compila el HTML con Handlebars e invoca Puppeteer Chromium para
   * exportar el binario PDF en formato A4 exacto.
   */
  async compilarYGenerarPdf(datos: Anexo9ConsolidadoDto): Promise<Buffer> {
    this.logger.log(`Iniciando compilación PDF de Anexo N°9 para expediente ${datos.expediente.codigo}`);

    if (!fs.existsSync(this.templatePath)) {
      throw new InternalServerErrorException(
        `Plantilla institucional no encontrada en: ${this.templatePath}`,
      );
    }

    const templateContent = fs.readFileSync(this.templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);

    // Formatear datos de presentación
    const firmantesFormateados = datos.firmantes.map((f) => ({
      ...f,
      hashSha256Corta: f.hashSha256 ? f.hashSha256.substring(0, 16) : 'N/A',
      fechaLegible: f.firmadoEn
        ? new Date(f.firmadoEn).toLocaleString('es-PE', {
            dateStyle: 'short',
            timeStyle: 'short',
          })
        : '',
    }));

    const htmlCompilado = template({
      ...datos,
      firmantes: firmantesFormateados,
    });

    let browser: Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=medium',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(htmlCompilado, {
        waitUntil: 'domcontentloaded',
      });

      // Asegurar que las fuentes estén renderizadas en Chromium
      await page.evaluateHandle('document.fonts.ready');

      const pdfUint8Array = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '12mm',
          bottom: '15mm',
          left: '12mm',
        },
      });

      const pdfBuffer = Buffer.from(pdfUint8Array);
      this.logger.log(
        `PDF generado exitosamente para ${datos.expediente.codigo} (${pdfBuffer.length} bytes)`,
      );

      return pdfBuffer;
    } catch (error) {
      this.logger.error(`Error crítico en Puppeteer al generar PDF:`, error);
      throw new InternalServerErrorException(
        `Fallo al compilar el PDF de Anexo N°9: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
