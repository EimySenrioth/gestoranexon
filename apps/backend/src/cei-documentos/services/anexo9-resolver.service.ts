import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class Anexo9ResolverService {
  private readonly logger = new Logger(Anexo9ResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve el CUID canónico del Expediente a partir de un identificador polimórfico
   * (CUID de expediente, código EXP-*, CUID de ticket o código TCK-*).
   */
  async resolverExpedienteId(identifier: string): Promise<string> {
    const raw = identifier.trim();

    // 1. Búsqueda directa por ID o Código de Expediente
    const exp = await this.prisma.expediente.findFirst({
      where: {
        OR: [{ id: raw }, { codigo: raw }],
      },
      select: { id: true },
    });

    if (exp) return exp.id;

    // 2. Búsqueda por ID o Código de Ticket
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        OR: [{ id: raw }, { codigo: raw }],
      },
      select: { expedienteId: true },
    });

    if (ticket && ticket.expedienteId) {
      return ticket.expedienteId;
    }

    throw new NotFoundException(
      `No se encontró ningún expediente asociado al identificador "${identifier}".`,
    );
  }

  /**
   * Busca el registro de documento en `expediente_documentos` para el identificador dado.
   */
  async obtenerDocumento(identifier: string, version: string = 'latest') {
    const expedienteId = await this.resolverExpedienteId(identifier);

    const where: any = {
      expedienteId,
      tipoDocumento: 'ANEXO_9',
    };

    if (version !== 'latest' && !isNaN(Number(version))) {
      where.version = Number(version);
    }

    const documento = await this.prisma.expedienteDocumento.findFirst({
      where,
      orderBy: { version: 'desc' },
      include: {
        expediente: {
          select: {
            id: true,
            codigo: true,
            estado: true,
          },
        },
      },
    });

    return {
      expedienteId,
      documento,
    };
  }
}

