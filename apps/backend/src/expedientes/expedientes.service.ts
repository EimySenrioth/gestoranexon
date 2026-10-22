import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateTicketDto } from '../ticketmanager/dto/index.js';
import {
  siguienteCorrelativo,
  formatearCorrelativo,
} from '../common/utils/correlativo.util.js';
import { normalizarCondicionales } from '../common/utils/duplicidad.util.js';
import { QueryMisSolicitudesDto } from './dto/query-mis-solicitudes.dto.js';
import { PaginadoResultadoDto, SolicitudFilaDto } from './dto/solicitud-fila.dto.js';
import { mapTicketToSolicitudFila } from './mappers/solicitud-estado.mapper.js';
import { ExpedienteNoEncontradoException } from '../common/errors/index.js';

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
   * Lista las solicitudes paginadas y proyectadas para el rol de Solicitante.
   * Filtra estrictamente por solicitanteId para garantizar propiedad de los datos.
   */
  async listarMisSolicitudes(
    solicitanteId: string,
    query: QueryMisSolicitudesDto,
  ): Promise<PaginadoResultadoDto<SolicitudFilaDto>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where = { solicitanteId };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        select: {
          id: true,
          codigo: true,
          estado: true,
          creadoEn: true,
          resultadoEvaluacionExterna: true,
          expediente: {
            select: {
              codigo: true,
              estado: true,
            },
          },
        },
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    const items = rows.map((r) => mapTicketToSolicitudFila(r));
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Lista todos los expedientes / trámites creados por un solicitante.
   * NOTA: Utilizado para vistas completas de otros roles.
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
      throw new ExpedienteNoEncontradoException(id);
    }

    return ticket;
  }
}
