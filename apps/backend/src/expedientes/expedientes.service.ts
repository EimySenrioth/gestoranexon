import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateTicketDto } from '../ticketmanager/dto/index.js';
import {
  siguienteCorrelativo,
  formatearCorrelativo,
} from '../common/utils/correlativo.util.js';
import { normalizarCondicionales } from '../common/utils/duplicidad.util.js';
import {
  QueryMisSolicitudesDto,
  SolicitudFilaDto,
  PaginadoResultadoDto,
  AsignarExpedienteDto,
  ExpedienteAsignadoResponseDto,
  MiembroCeiDisponibleDto,
} from './dto/index.js';
import { mapTicketToSolicitudFila } from './mappers/solicitud-estado.mapper.js';
import {
  ExpedienteNoEncontradoException,
  ExpedienteYaAsignadoException,
  MiembroCeiNoEncontradoException,
  UsuarioNoEsMiembroCeiException,
  ExpedienteNoAptoParaAsignacionException,
} from '../common/errors/index.js';

export const ROLES_CEI_ASIGNABLES = [
  'PRESIDENTE_CEI',
  'VICEPRESIDENTE_CEI',
  'SECRETARIA_TECNICA_CEI',
  'SECRETARIA_ADMINISTRATIVA_CEI',
  'VOCAL_CEI',
] as const;

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

      // 3. Auto-asignación plenaria (1 a 5): Obtener los miembros activos del CEI con sus roles
      const miembrosCei = await tx.usuario.findMany({
        where: {
          activo: true,
          roles: {
            some: {
              rol: {
                codigo: { in: ROLES_CEI_ASIGNABLES as unknown as string[] },
              },
            },
          },
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          roles: {
            select: {
              rol: {
                select: {
                  codigo: true,
                  nombre: true,
                },
              },
            },
          },
        },
        orderBy: [{ creadoEn: 'asc' }],
      });

      // 4. Construir metadatos robustos de gobernanza, snapshot histórico y plazos
      const fechaAsignacion = new Date();
      const plazoDiasHabiles = 15;
      const fechaLimiteDictamen = new Date(fechaAsignacion);
      fechaLimiteDictamen.setDate(fechaLimiteDictamen.getDate() + 20); // 15 días hábiles aprox ~ 20 calendario

      const comiteSnapshot = miembrosCei.map((m) => {
        const rolPrincipal = m.roles?.find((r) =>
          ROLES_CEI_ASIGNABLES.includes(r.rol.codigo as any),
        )?.rol;
        return {
          id: m.id,
          nombreCompleto: `${m.nombre} ${m.apellido}`.trim(),
          rolCodigo: rolPrincipal?.codigo || 'EVALUADOR',
          rolNombre: rolPrincipal?.nombre || 'Miembro del CEI',
          email: m.email,
        };
      });

      const metadataAsignacion = {
        asignacionPlenaria: {
          tipo: 'AUTO_PLENO_CEI',
          versionRegla: 'v1.0-pleno-cei',
          controlPlazos: {
            fechaAsignacion: fechaAsignacion.toISOString(),
            plazoDiasHabiles,
            fechaLimiteDictamen: fechaLimiteDictamen.toISOString(),
            alertaVencimientoDias: 3,
          },
          reglasDeliberacion: {
            modalidad: 'PLENO_ORDINARIO',
            totalEvaluadores: miembrosCei.length,
            quorumMinimoSesion: 3,
            mayoriaRequerida: 3,
            requiereFirmaPresidencia: true,
          },
          integridadAsignacion: {
            rolesRequeridos: 5,
            rolesCubiertos: comiteSnapshot.length,
            estado: comiteSnapshot.length >= 5 ? 'COMPLETA' : 'PARCIAL',
          },
          comiteSnapshot,
        },
        asuntoPedido: {
          tieneAudio: Boolean(dto.tieneAudioAsunto),
          totalArchivos: Array.isArray(dto.archivosAsuntoInfo) ? dto.archivosAsuntoInfo.length : 0,
          archivos: Array.isArray(dto.archivosAsuntoInfo) ? dto.archivosAsuntoInfo : [],
        },
      };

      // 5. Crear el trámite en la tabla 'tickets' vinculado al expediente con sus metadatos
      const { tieneAudioAsunto, archivosAsuntoInfo, ...ticketCampos } = dataLimpia;

      const ticket = await tx.ticket.create({
        data: {
          ...ticketCampos,
          codigo: codigoTicket,
          solicitanteId,
          expedienteId: expediente.id,
          estado: 'REGISTRADO',
          fechaPresentacion: fechaAsignacion,
          metadata: metadataAsignacion,
        },
      });

      // 6. Crear las fichas en 'evaluaciones' para cada miembro del CEI
      if (miembrosCei.length > 0) {
        await tx.evaluacion.createMany({
          data: miembrosCei.map((m) => ({
            expedienteId: expediente.id,
            evaluadorId: m.id,
          })),
        });

        // 7. Generar notificaciones internas para los evaluadores
        await tx.notificacion.createMany({
          data: miembrosCei.map((m) => ({
            usuarioId: m.id,
            titulo: 'Nuevo expediente disponible',
            mensaje: `El expediente ${expediente.codigo} ha sido registrado y asignado al pleno del CEI.`,
            canal: 'SISTEMA',
          })),
        });
      }

      // 8. Registrar en el historial de auditoría
      await tx.ticketHistorial.create({
        data: {
          ticketId: ticket.id,
          estadoNuevo: 'REGISTRADO',
          accion: 'CREATE_EXPEDIENTE',
          usuarioId: solicitanteId,
          metadata: metadataAsignacion,
        },
      });

      this.logger.log(
        `Expediente guardado y auto-asignado al pleno del CEI (${miembrosCei.length} evaluadores). Ticket: ${ticket.codigo}, Expediente: ${expediente.codigo}`,
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

  /**
   * [PRESERVADO PARA EL FUTURO / REASIGNACIÓN ADMINISTRATIVA]
   * Permite a la Presidencia o Administración reasignar de forma manual o extraordinaria
   * un expediente a un miembro específico del CEI (por licencias, conflicto de interés o sustitución).
   * Ejecuta 5 operaciones en una transacción atómica interactiva de Prisma.
   */
  async asignarExpediente(
    expedienteId: string,
    dto: AsignarExpedienteDto,
    adminId: string,
  ): Promise<ExpedienteAsignadoResponseDto> {
    this.logger.log(
      `Iniciando asignación de expediente ${expedienteId} a miembro CEI ${dto.miembroCeiId} por admin ${adminId}`,
    );

    // 1. Buscar expediente por ID o código
    const expediente = await this.prisma.expediente.findFirst({
      where: {
        OR: [{ id: expedienteId }, { codigo: expedienteId }],
      },
      include: {
        ticket: true,
      },
    });

    if (!expediente) {
      throw new ExpedienteNoEncontradoException(expedienteId);
    }

    // 2. Validar estado actual del expediente
    if (expediente.estado === 'EN_EVALUACION') {
      throw new ExpedienteYaAsignadoException(
        expediente.id,
        expediente.ticket?.asignadoAId || undefined,
      );
    }

    if (expediente.estado !== 'INICIADO') {
      throw new ExpedienteNoAptoParaAsignacionException(
        expediente.id,
        expediente.estado,
      );
    }

    // 3. Buscar y validar miembro CEI asignable
    const miembro = await this.prisma.usuario.findUnique({
      where: { id: dto.miembroCeiId },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!miembro || !miembro.activo) {
      throw new MiembroCeiNoEncontradoException(dto.miembroCeiId);
    }

    const roleCodes = miembro.roles.map((r) => r.rol.codigo.toUpperCase());
    const esMiembroCei = roleCodes.some((code) =>
      ROLES_CEI_ASIGNABLES.includes(code as any),
    );

    if (!esMiembroCei) {
      throw new UsuarioNoEsMiembroCeiException(dto.miembroCeiId, roleCodes);
    }

    // 4. Ejecutar transacción interactiva en PostgreSQL
    return await this.prisma.$transaction(async (tx) => {
      // 4.1 UPDATE expedientes
      await tx.expediente.update({
        where: { id: expediente.id },
        data: {
          estado: 'EN_EVALUACION',
        },
      });

      // 4.2 UPDATE tickets
      if (expediente.ticket) {
        await tx.ticket.update({
          where: { id: expediente.ticket.id },
          data: {
            asignadoAId: miembro.id,
          },
        });

        // 4.4 INSERT INTO ticket_historial
        await tx.ticketHistorial.create({
          data: {
            ticketId: expediente.ticket.id,
            estadoAnterior: expediente.ticket.estado,
            estadoNuevo: expediente.ticket.estado,
            accion: 'ASIGNACION_MIEMBRO_CEI',
            usuarioId: adminId,
            metadata: {
              estadoExpediente: 'EN_EVALUACION',
              asignadoAId: miembro.id,
              asignadoANombre: `${miembro.nombre} ${miembro.apellido}`.trim(),
              roles: roleCodes,
              notas: dto.notas,
              plazoDias: dto.plazoDias,
            },
          },
        });
      }

      // 4.3 INSERT INTO evaluaciones
      const evaluacionExistente = await tx.evaluacion.findFirst({
        where: {
          expedienteId: expediente.id,
          evaluadorId: miembro.id,
        },
      });

      if (!evaluacionExistente) {
        await tx.evaluacion.create({
          data: {
            expedienteId: expediente.id,
            evaluadorId: miembro.id,
          },
        });
      }

      // 4.5 INSERT INTO notificaciones
      await tx.notificacion.create({
        data: {
          usuarioId: miembro.id,
          titulo: 'Nuevo expediente asignado',
          mensaje: `Se le ha asignado el expediente ${expediente.codigo} para evaluación ética y legal.`,
          canal: 'SISTEMA',
        },
      });

      this.logger.log(
        `Expediente ${expediente.codigo} asignado exitosamente a miembro CEI ${miembro.id} (${roleCodes.join(', ')})`,
      );

      return {
        expedienteId: expediente.id,
        codigoExpediente: expediente.codigo,
        ticketId: expediente.ticket?.id || '',
        codigoTicket: expediente.ticket?.codigo || '',
        estadoAnterior: expediente.estado,
        estadoNuevo: 'EN_EVALUACION',
        asignadoA: {
          id: miembro.id,
          nombre: miembro.nombre,
          apellido: miembro.apellido,
          email: miembro.email,
          roles: roleCodes,
        },
        asignadoPorId: adminId,
        fechaAsignacion: new Date().toISOString(),
        notas: dto.notas,
        plazoDias: dto.plazoDias,
      };
    });
  }

  /**
   * Lista los expedientes asignados a un miembro específico del CEI.
   * Consulta tanto expedientes asignados directamente (tickets.asignadoAId)
   * como expedientes auto-asignados al pleno (expediente.evaluaciones).
   */
  async listarAsignadosAMiembroCei(
    miembroCeiId: string,
    query: QueryMisSolicitudesDto,
  ) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where = {
      OR: [
        { asignadoAId: miembroCeiId },
        {
          expediente: {
            evaluaciones: {
              some: { evaluadorId: miembroCeiId },
            },
          },
        },
      ],
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.findMany({
        where,
        include: {
          expediente: {
            include: {
              evaluaciones: {
                where: { evaluadorId: miembroCeiId },
                select: {
                  id: true,
                  resultado: true,
                  actualizadoEn: true,
                  creadoEn: true,
                },
              },
            },
          },
          solicitante: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          documentos: true,
        },
        orderBy: [{ actualizadoEn: 'desc' }, { creadoEn: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      items: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Lista los miembros activos del CEI disponibles para asignación,
   * incluyendo su carga actual de expedientes en proceso.
   */
  async listarMiembrosCeiDisponibles(): Promise<MiembroCeiDisponibleDto[]> {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        activo: true,
        roles: {
          some: {
            rol: {
              codigo: { in: ROLES_CEI_ASIGNABLES as unknown as string[] },
            },
          },
        },
      },
      include: {
        roles: {
          include: { rol: true },
        },
        ticketsAsignados: {
          where: {
            estado: { notIn: ['ARCHIVADO', 'CANCELADO'] },
            expediente: {
              estado: { in: ['EN_EVALUACION', 'OBSERVADO'] },
            },
          },
          select: { id: true },
        },
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      roles: u.roles.map((r) => r.rol.codigo),
      cargaExpedientesActivos: u.ticketsAsignados.length,
    }));
  }
}
