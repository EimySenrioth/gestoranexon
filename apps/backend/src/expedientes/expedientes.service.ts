import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateTicketDto } from '../ticketmanager/dto/index.js';
import {
  siguienteCorrelativo,
  formatearCorrelativo,
} from '../common/utils/correlativo.util.js';
import { normalizarCondicionales } from '../common/utils/duplicidad.util.js';

export interface ExpedienteCreado {
  id: string;
  codigo: string;
  titulo: string;
  estado: string;
  solicitanteId: string;
  creadoEn: Date;
  codigoExpediente?: string;
}

@Injectable()
export class ExpedientesService {
  private readonly logger = new Logger(ExpedientesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra y almacena un expediente / trámite de forma persistente en PostgreSQL.
   */
  async crearExpediente(dto: CreateTicketDto, solicitanteId: string): Promise<ExpedienteCreado> {
    this.logger.log(`Creando expediente para solicitante: ${solicitanteId}`);

    return await this.prisma.$transaction(async (tx) => {
      const anio = new Date().getFullYear();
      const numTicket = await siguienteCorrelativo(tx, `TCK-${anio}`);
      const codigoTicket = formatearCorrelativo('TCK', anio, numTicket);

      const numExp = await siguienteCorrelativo(tx, `EXP-${anio}`);
      const codigoExpediente = formatearCorrelativo('EXP', anio, numExp);

      // 1. Crear el expediente institucional en la tabla 'expedientes'
      const expediente = await tx.expediente.create({
        data: {
          codigo: codigoExpediente,
          estado: 'INICIADO',
          gestorId: solicitanteId,
        },
      });

      // 2. Normalizar campos condicionales y limpiar entradas
      const dataLimpia = normalizarCondicionales(dto);

      // 3. Crear el trámite en la tabla 'tickets' vinculado al expediente
      const ticket = await tx.ticket.create({
        data: {
          ...dataLimpia,
          codigo: codigoTicket,
          solicitanteId,
          expedienteId: expediente.id,
          estado: 'REGISTRADO',
          fechaPresentacion: new Date(),
        },
      });

      // 4. Registrar en el historial de auditoría
      await tx.ticketHistorial.create({
        data: {
          ticketId: ticket.id,
          estadoNuevo: 'REGISTRADO',
          accion: 'CREATE_EXPEDIENTE',
          usuarioId: solicitanteId,
        },
      });

      this.logger.log(
        `Expediente guardado exitosamente en BD. Ticket: ${ticket.codigo}, Expediente: ${expediente.codigo}`
      );

      return {
        id: ticket.id,
        codigo: ticket.codigo,
        titulo: ticket.titulo,
        estado: ticket.estado,
        solicitanteId: ticket.solicitanteId,
        creadoEn: ticket.creadoEn,
        codigoExpediente: expediente.codigo,
      };
    });
  }

  /**
   * Lista todos los expedientes / trámites creados por un solicitante.
   */
  async listarPorSolicitante(solicitanteId: string) {
    return await this.prisma.ticket.findMany({
      where: { solicitanteId },
      include: {
        expediente: true,
        documentos: true,
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  /**
   * Obtiene el detalle de un expediente por su ID.
   */
  async obtenerPorId(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        expediente: true,
        documentos: true,
        historial: {
          orderBy: { creadoEn: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Expediente con ID ${id} no encontrado.`);
    }

    return ticket;
  }
}
