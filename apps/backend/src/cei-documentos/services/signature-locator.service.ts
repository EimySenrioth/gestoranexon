import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { FirmanteConsolidado } from '../dto/anexo9-consolidado.dto.js';

const CARGOS_ORDENADOS = [
  'PRESIDENTE_CEI',
  'VICEPRESIDENTE_CEI',
  'SECRETARIA_TECNICA_CEI',
  'SECRETARIA_ADMINISTRATIVA_CEI',
  'VOCAL_CEI',
] as const;

const NOMBRES_CARGOS: Record<string, string> = {
  PRESIDENTE_CEI: 'Presidente del CEI',
  VICEPRESIDENTE_CEI: 'Vicepresidente del CEI',
  SECRETARIA_TECNICA_CEI: 'Secretaría Técnica del CEI',
  SECRETARIA_TECNICA: 'Secretaría Técnica del CEI',
  SECRETARIA_ADMINISTRATIVA_CEI: 'Secretaría Administrativa del CEI',
  SECRETARIA_ADMINISTRATIVA: 'Secretaría Administrativa del CEI',
  VOCAL_CEI: 'Vocal del CEI',
};

@Injectable()
export class SignatureLocatorService {
  private readonly logger = new Logger(SignatureLocatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida los primeros bytes (Magic Numbers) de una cadena Data URL Base64
   * para asegurar que sea genuinamente PNG o JPEG y no SVG u otro archivo malicioso.
   */
  validarMagicNumbers(dataUrl: string): boolean {
    try {
      const match = dataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
      if (!match) return false;

      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');
      if (buffer.length < 8) return false;

      // PNG: 89 50 4E 47 0D 0A 1A 0A
      const esPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;

      // JPEG: FF D8 FF
      const esJpeg =
        buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

      return esPng || esJpeg;
    } catch {
      return false;
    }
  }

  /**
   * Localiza y valida estrictamente las 5 firmas de los miembros del CEI
   * para un expediente dado. Si falta una sola firma, el proceso se interrumpe.
   */
  async localizarYValidarFirmas(expedienteId: string): Promise<FirmanteConsolidado[]> {
    this.logger.log(`Localizando firmas reglamentarias para expediente ${expedienteId}`);

    const evaluaciones = await this.prisma.evaluacion.findMany({
      where: { expedienteId },
      include: {
        evaluador: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            roles: {
              select: {
                rol: {
                  select: { codigo: true, nombre: true },
                },
              },
            },
          },
        },
        firmas: {
          orderBy: { creadoEn: 'desc' },
          take: 1,
        },
      },
    });

    if (evaluaciones.length < 5) {
      throw new BadRequestException(
        `No se puede generar el Anexo N°9: El expediente cuenta con ${evaluaciones.length} de las 5 evaluaciones requeridas.`,
      );
    }

    const firmantesMapeados: FirmanteConsolidado[] = [];

    for (const ev of evaluaciones) {
      const usuario = ev.evaluador;
      const nombreCompleto = `${usuario.nombre} ${usuario.apellido}`.trim();
      
      // Identificar cargo CEI oficial del usuario
      const codigosRoles = usuario.roles.map((r) => r.rol.codigo.toUpperCase());
      const cargoCei =
        CARGOS_ORDENADOS.find((cargo) => codigosRoles.includes(cargo)) ||
        codigosRoles.find((c) => c.includes('CEI') || c.includes('SECRETARIA')) ||
        'EVALUADOR';

      const cargoLegible = NOMBRES_CARGOS[cargoCei] || cargoCei;

      // REGLA BLOQUEANTE: La firma DEBE existir
      const firmaRegistro = ev.firmas && ev.firmas.length > 0 ? ev.firmas[0] : null;

      if (!firmaRegistro || !firmaRegistro.firma) {
        throw new BadRequestException(
          `No se puede generar el Anexo N°9: Falta la firma digital reglamentaria para el evaluador ${nombreCompleto} (Cargo: ${cargoLegible}). Todas las 5 firmas deben estar registradas formalmente.`,
        );
      }

      // Validar integridad de Magic Numbers
      if (!this.validarMagicNumbers(firmaRegistro.firma)) {
        throw new BadRequestException(
          `No se puede generar el Anexo N°9: La firma de ${nombreCompleto} (${cargoLegible}) no posee un formato de imagen binaria válido (PNG/JPEG).`,
        );
      }

      firmantesMapeados.push({
        evaluadorId: usuario.id,
        nombreCompleto,
        cargoCei: cargoLegible,
        firmaDataUrl: firmaRegistro.firma,
        hashSha256: firmaRegistro.hashSha256 || '',
        firmadoEn: firmaRegistro.creadoEn.toISOString(),
      });
    }

    // Ordenar jerárquicamente: Presidente, Vicepresidente, Sec Técnica, Sec Adm, Vocal
    firmantesMapeados.sort((a, b) => {
      const idxA = CARGOS_ORDENADOS.findIndex((c) =>
        a.cargoCei.toLowerCase().includes(c.toLowerCase().replace('_cei', '')),
      );
      const idxB = CARGOS_ORDENADOS.findIndex((c) =>
        b.cargoCei.toLowerCase().includes(c.toLowerCase().replace('_cei', '')),
      );
      return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
    });

    return firmantesMapeados;
  }
}

