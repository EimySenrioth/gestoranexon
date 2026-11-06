import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
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
  AprobarPresidenciaDto,
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

      // Auto-sincronizar los documentos del proyecto en ticket_documentos para que estén disponibles
      await this.sincronizarDocumentosObligatoriosTicket(tx, ticket);

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
   * Asegura que los documentos base del proyecto registrados en el ticket
   * (naturalezaProyecto, participantes, modalidad, planProyecto)
   * existan como registros en ticket_documentos para que sean entregados por el endpoint
   * y puedan ser visualizados y descargados.
   */
  private async sincronizarDocumentosObligatoriosTicket(
    client: any,
    ticket: any,
  ): Promise<any[]> {
    if (!ticket) return [];

    if (!client?.ticketDocumento?.findMany) {
      return ticket.documentos || [];
    }

    try {
      const uploadDir =
        process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads', 'documents');

      const docsActuales = await client.ticketDocumento.findMany({
        where: { ticketId: ticket.id },
        orderBy: { creadoEn: 'asc' },
      });

      const tiposExistentes = new Set(docsActuales.map((d: any) => d.tipoDocumental));
      const nombresExistentes = new Set(docsActuales.map((d: any) => d.nombreOriginal));

      const faltantes: Array<{ tipo: string; nombre: string }> = [];

      if (
        ticket.naturalezaProyecto &&
        typeof ticket.naturalezaProyecto === 'string' &&
        ticket.naturalezaProyecto.trim()
      ) {
        if (
          !tiposExistentes.has('NATURALEZA_PROYECTO') &&
          !nombresExistentes.has(ticket.naturalezaProyecto)
        ) {
          faltantes.push({ tipo: 'NATURALEZA_PROYECTO', nombre: ticket.naturalezaProyecto });
        }
      }

      if (Array.isArray(ticket.participantes)) {
        ticket.participantes.forEach((p: any) => {
          if (
            p &&
            typeof p === 'string' &&
            p.trim() &&
            !tiposExistentes.has('PARTICIPANTES') &&
            !nombresExistentes.has(p)
          ) {
            faltantes.push({ tipo: 'PARTICIPANTES', nombre: p });
          }
        });
      }

      if (
        ticket.modalidad &&
        typeof ticket.modalidad === 'string' &&
        ticket.modalidad.trim()
      ) {
        if (
          !tiposExistentes.has('MODALIDAD') &&
          !nombresExistentes.has(ticket.modalidad)
        ) {
          faltantes.push({ tipo: 'MODALIDAD', nombre: ticket.modalidad });
        }
      }

      if (
        ticket.planProyecto &&
        typeof ticket.planProyecto === 'string' &&
        ticket.planProyecto.trim()
      ) {
        if (
          !tiposExistentes.has('PLAN_PROYECTO') &&
          !nombresExistentes.has(ticket.planProyecto)
        ) {
          faltantes.push({ tipo: 'PLAN_PROYECTO', nombre: ticket.planProyecto });
        }
      }

      const nuevosDocs: any[] = [];

      for (const item of faltantes) {
        try {
          const filePath = path.join(uploadDir, item.nombre);
          let size = 1024;
          let hash = '0'.repeat(64);

          if (fs.existsSync(filePath)) {
            const buf = fs.readFileSync(filePath);
            size = buf.length;
            hash = crypto.createHash('sha256').update(buf).digest('hex');
          }

          const mime = item.nombre.endsWith('.pdf')
            ? 'application/pdf'
            : item.nombre.endsWith('.mp3')
              ? 'audio/mpeg'
              : item.nombre.endsWith('.zip')
                ? 'application/zip'
                : 'application/octet-stream';

          const nuevo = await client.ticketDocumento.create({
            data: {
              ticketId: ticket.id,
              nombreOriginal: item.nombre,
              nombreArchivo: item.nombre,
              tipoDocumental: item.tipo,
              mimeType: mime,
              tamanioBytes: size,
              hashSha256: hash,
              storagePath: filePath,
              version: 1,
              estado: 'PENDIENTE_VALIDACION',
              subidoPorId: ticket.solicitanteId || 'usr_solicitante_1',
            },
          });
          nuevosDocs.push(nuevo);
        } catch (err) {
          this.logger.warn(`No se pudo sincronizar documento ${item.tipo} (${item.nombre}): ${err}`);
        }
      }

      return [...docsActuales, ...nuevosDocs];
    } catch (err) {
      this.logger.warn(`Error en sincronizarDocumentosObligatoriosTicket para ticket ${ticket.id}: ${err}`);
      return ticket.documentos || [];
    }
  }

  /**
   * Obtiene el detalle de un expediente por su ID.
   */
  async obtenerPorId(id: string) {
    // 1. Buscar primero en Expediente (por id, codigo o ticket relacionado)
    const expediente = await this.prisma.expediente.findFirst({
      where: {
        OR: [
          { id },
          { codigo: id },
          { ticket: { id } },
          { ticket: { codigo: id } },
        ],
      },
      include: {
        ticket: {
          include: {
            solicitante: true,
            asignadoA: true,
            documentos: true,
          },
        },
        documentos: true,
        historial: {
          orderBy: { creadoEn: 'asc' },
        },
      },
    });

    if (expediente) {
      const ticketDocs = expediente.ticket
        ? await this.sincronizarDocumentosObligatoriosTicket(this.prisma, expediente.ticket)
        : [];

      const docsCombinados =
        ticketDocs.length > 0
          ? ticketDocs
          : expediente.documentos || [];

      return {
        id: expediente.id,
        codigo: expediente.codigo,
        estado: expediente.estado,
        ticket: expediente.ticket
          ? {
              ...expediente.ticket,
              documentos: ticketDocs,
            }
          : null,
        documentos: docsCombinados,
        historial: expediente.historial,
      };
    }

    // 2. Si no fue por expediente, buscar en Ticket (por id, codigo o expediente relacionado)
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        OR: [
          { id },
          { codigo: id },
          { expediente: { id } },
          { expediente: { codigo: id } },
        ],
      },
      include: {
        solicitante: true,
        asignadoA: true,
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

    const ticketDocs = await this.sincronizarDocumentosObligatoriosTicket(this.prisma, ticket);

    return {
      id: ticket.expediente?.id || ticket.id,
      codigo: ticket.expediente?.codigo || ticket.codigo,
      estado: ticket.expediente?.estado || ticket.estado,
      ticket: {
        ...ticket,
        documentos: ticketDocs,
      },
      documentos: ticketDocs,
      historial: ticket.historial,
    };
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
                select: {
                  id: true,
                  evaluadorId: true,
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

    const items = rows.map((row) => {
      const todasEvaluaciones = row.expediente?.evaluaciones ?? [];
      const evaluacionesCompletadas = todasEvaluaciones.filter(
        (ev) => ev.resultado !== null && ev.resultado !== undefined,
      ).length;
      const totalEvaluadores =
        todasEvaluaciones.length > 0 ? todasEvaluaciones.length : 5;
      const evaluacionesMiembro = todasEvaluaciones.filter(
        (ev) => ev.evaluadorId === miembroCeiId,
      );

      return {
        ...row,
        expediente: row.expediente
          ? {
              ...row.expediente,
              evaluaciones: evaluacionesMiembro,
              todasEvaluaciones,
              evaluacionesCompletadas,
              totalEvaluadores,
            }
          : null,
      };
    });

    return {
      items,
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

  /**
   * Obtiene el progreso detallado de la evaluación para el Solicitante:
   * Retorna las 5 evaluaciones ordenadas dinámicamente por orden de llegada (finalización de evaluación),
   * junto con el desglose de hitos de cada una y el cálculo proporcional (0/5 a 5/5).
   */
  async obtenerProgresoEvaluacionSolicitante(expedienteIdOIdentificador: string, solicitanteId: string) {
    // 1. Buscar el expediente (por id, codigo o ticketId)
    const expediente = await this.prisma.expediente.findFirst({
      where: {
        OR: [
          { id: expedienteIdOIdentificador },
          { codigo: expedienteIdOIdentificador },
          { ticket: { id: expedienteIdOIdentificador } },
          { ticket: { codigo: expedienteIdOIdentificador } },
        ],
        // Verificamos propiedad para seguridad del solicitante
        ticket: {
          solicitanteId,
        },
      },
      include: {
        ticket: true,
        evaluaciones: {
          include: {
            firmas: {
              orderBy: { creadoEn: 'desc' },
              take: 1,
            },
            evaluador: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                roles: {
                  include: { rol: true },
                },
              },
            },
          },
        },
      },
    });

    if (!expediente) {
      throw new NotFoundException(
        `Expediente no encontrado o no pertenece al solicitante autenticado.`,
      );
    }

    const totalEvaluadores = 5;
    const evals = expediente.evaluaciones || [];

    // Helper para formatear fecha a D/M/YYYY
    const formatearFecha = (d: Date | null | undefined): string => {
      if (!d) return '—';
      const dia = d.getDate();
      const mes = d.getMonth() + 1;
      const anio = d.getFullYear();
      return `${mes}/${dia}/${anio}`;
    };

    // 2. Separar completadas y pendientes
    // Una evaluación se considera completada si tiene resultado y firma
    const completadas = evals
      .filter((e) => e.resultado !== null && e.firmas.length > 0)
      .sort((a, b) => {
        const fechaA = a.firmas[0]?.creadoEn || a.actualizadoEn;
        const fechaB = b.firmas[0]?.creadoEn || b.actualizadoEn;
        return new Date(fechaA).getTime() - new Date(fechaB).getTime();
      });

    const pendientes = evals.filter(
      (e) => e.resultado === null || e.firmas.length === 0,
    );

    const todasOrdenadas = [...completadas, ...pendientes];

    // 3. Mapear dinámicamente a los slots 01 al 05
    const evaluacionesSlots = [];

    for (let i = 0; i < totalEvaluadores; i++) {
      const numSlot = String(i + 1).padStart(2, '0');
      const evaluacion = todasOrdenadas[i];

      if (evaluacion && evaluacion.resultado !== null && evaluacion.firmas.length > 0) {
        const fechaFirma = evaluacion.firmas[0]?.creadoEn || evaluacion.actualizadoEn;
        const fechaStr = formatearFecha(new Date(fechaFirma));
        const rolEvaluador =
          evaluacion.evaluador.roles[0]?.rol?.nombre ||
          evaluacion.evaluador.roles[0]?.rol?.codigo ||
          'Miembro del CEI';
        const nombreEvaluador = `${evaluacion.evaluador.nombre || ''} ${evaluacion.evaluador.apellido || ''}`.trim();

        const mapResultadoTexto = (res: string | null) => {
          if (res === 'APROBADO') return 'Aprobado';
          if (res === 'APROBADO_CON_OBSERVACIONES') return 'Aprobado con observaciones';
          if (res === 'NO_APROBADO') return 'No aprobado';
          return 'Pendiente';
        };

        const evaluarConformidadSeccion = (jsonStr: string | null): string => {
          if (!jsonStr) return 'Pendiente';
          try {
            const items = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
            if (Array.isArray(items) && items.length > 0) {
              const totalItems = items.length;
              const totalCumplen = items.filter((i: any) => i.cumple === true).length;

              if (totalCumplen === totalItems) {
                return 'Conforme';
              } else if (totalCumplen === 0) {
                return 'No cumple';
              } else {
                return 'Cumple parcialmente';
              }
            }
          } catch {
            // Si no se puede parsear, fallback
          }
          return 'Conforme';
        };

        const estadoRecomendaciones = mapResultadoTexto(evaluacion.resultado);
        const tieneFirma = evaluacion.firmas && evaluacion.firmas.length > 0;

        const hitos = [
          {
            id: 'principios',
            titulo: 'Revisión de Principios Éticos',
            fecha: fechaStr,
            estado: evaluarConformidadSeccion(evaluacion.principiosEticos),
          },
          {
            id: 'metodologia',
            titulo: 'Evaluación Metodológica y de Riesgos',
            fecha: fechaStr,
            estado: evaluarConformidadSeccion(evaluacion.metodologiaRiesgos),
          },
          {
            id: 'normativa',
            titulo: 'Verificación Normativa y Legal',
            fecha: fechaStr,
            estado: evaluarConformidadSeccion(evaluacion.normativaLegal),
          },
          {
            id: 'dictamen',
            titulo: 'Dictamen de la Evaluación',
            fecha: fechaStr,
            estado: estadoRecomendaciones,
          },
          {
            id: 'firma',
            titulo: 'Firma y Emisión del Evaluador',
            fecha: fechaStr,
            estado: tieneFirma ? 'Firmado' : 'Pendiente',
          },
          {
            id: 'envio',
            titulo: 'Envío del expediente solicitante',
            fecha: expediente.estado === 'APROBADO' || expediente.estado === 'RECHAZADO' || expediente.estado === 'CERRADO' ? fechaStr : '—',
            estado: expediente.estado === 'APROBADO' || expediente.estado === 'RECHAZADO' || expediente.estado === 'CERRADO' ? 'Aprobado' : 'Pendiente',
          },
        ];

        evaluacionesSlots.push({
          numero: numSlot,
          evaluadorRol: rolEvaluador,
          evaluadorNombre: nombreEvaluador,
          completado: true,
          resultado: evaluacion.resultado,
          fechaEvaluacion: fechaStr,
          hitos,
        });
      } else {
        // Slot pendiente / en espera de evaluación
        evaluacionesSlots.push({
          numero: numSlot,
          evaluadorRol: null,
          evaluadorNombre: null,
          completado: false,
          resultado: null,
          fechaEvaluacion: null,
          hitos: [
            {
              id: 'principios',
              titulo: 'Revisión de Principios Éticos',
              fecha: '—',
              estado: 'Pendiente',
            },
            {
              id: 'metodologia',
              titulo: 'Evaluación Metodológica y de Riesgos',
              fecha: '—',
              estado: 'Pendiente',
            },
            {
              id: 'normativa',
              titulo: 'Verificación Normativa y Legal',
              fecha: '—',
              estado: 'Pendiente',
            },
            {
              id: 'dictamen',
              titulo: 'Dictamen de la Evaluación',
              fecha: '—',
              estado: 'Pendiente',
            },
            {
              id: 'firma',
              titulo: 'Firma y Emisión del Evaluador',
              fecha: '—',
              estado: 'Pendiente',
            },
            {
              id: 'envio',
              titulo: 'Envío del expediente solicitante',
              fecha: '—',
              estado: 'Pendiente',
            },
          ],
        });
      }
    }

    const evaluacionesCompletadas = completadas.length;
    const porcentajeProgreso = Math.round(
      (evaluacionesCompletadas / totalEvaluadores) * 100,
    );

    return {
      expedienteId: expediente.id,
      codigoExpediente: expediente.codigo,
      ticketCodigo: expediente.ticket?.codigo,
      evaluacionesCompletadas,
      totalEvaluadores,
      porcentajeProgreso,
      evaluaciones: evaluacionesSlots,
    };
  }

  /**
   * Dictamen y aprobación formal de Presidencia del CEI:
   * Valida que el expediente cuente con las 5 calificaciones requeridas.
   * Ejecuta una transacción atómica interactiva de Prisma que:
   * 1. Actualiza Expediente a APROBADO.
   * 2. Actualiza Ticket con resultadoEvaluacionExterna = 'APROBADO', fechaRecepcionEvaluacion y cerradoEn.
   * 3. Si existe SesionVotacion, la cierra y establece dictamenPresidente.
   * 4. Registra el evento de auditoría en la tabla Historial y TicketHistorial.
   */
  async aprobarPorPresidencia(
    idOIdentificador: string,
    presidenteId: string,
    dto: AprobarPresidenciaDto,
  ) {
    // 1. Buscar expediente por id, codigo o ticketId
    const expediente = await this.prisma.expediente.findFirst({
      where: {
        OR: [
          { id: idOIdentificador },
          { codigo: idOIdentificador },
          { ticket: { id: idOIdentificador } },
          { ticket: { codigo: idOIdentificador } },
        ],
      },
      include: {
        ticket: true,
        evaluaciones: true,
      },
    });

    if (!expediente) {
      throw new ExpedienteNoEncontradoException(idOIdentificador);
    }

    // 2. Validar que tenga las 5 calificaciones
    const completadas = (expediente.evaluaciones || []).filter(
      (ev) => Boolean(ev.resultado),
    );

    if (completadas.length < 5) {
      throw new BadRequestException(
        `El expediente aún no cuenta con las 5 calificaciones requeridas para emitir dictamen (calificaciones actuales: ${completadas.length}/5).`,
      );
    }

    const ahora = new Date();

    // 3. Transacción atómica en PostgreSQL usando await para todas las operaciones asíncronas
    return await this.prisma.$transaction(async (tx) => {
      // 3.1 Actualizar Expediente
      const expedienteActualizado = await tx.expediente.update({
        where: { id: expediente.id },
        data: {
          estado: 'APROBADO',
        },
      });

      // 3.2 Actualizar Ticket asociado
      if (expediente.ticket) {
        await tx.ticket.update({
          where: { id: expediente.ticket.id },
          data: {
            resultadoEvaluacionExterna: 'APROBADO',
            fechaRecepcionEvaluacion: ahora,
            cerradoEn: ahora,
          },
        });

        // 3.3 Registrar en TicketHistorial
        await tx.ticketHistorial.create({
          data: {
            ticketId: expediente.ticket.id,
            estadoAnterior: expediente.ticket.estado,
            estadoNuevo: expediente.ticket.estado,
            accion: 'DICTAMEN_APROBACION_PRESIDENCIA',
            usuarioId: presidenteId,
            metadata: {
              estadoExpediente: 'APROBADO',
              dictamen: 'APROBADO',
              observaciones: dto?.observaciones || null,
              resolucionUrl: dto?.resolucionUrl || null,
              totalCalificaciones: completadas.length,
            },
          },
        });
      }

      // 3.4 Si existe sesión de votación asociada, cerrarla
      const sesionVotacion = await tx.sesionVotacion.findFirst({
        where: { expedienteId: expediente.id },
      });

      if (sesionVotacion) {
        const doc = sesionVotacion.documentoJson as any;
        if (doc) {
          doc.dictamenPresidenteCei = {
            presidenteId,
            resultado: 'Aprobado',
            fechaEmision: ahora.toISOString(),
            observaciones: dto?.observaciones,
          };
          doc.dictamenGlobal = {
            resultado: 'Aprobado',
            reglaAplicada: 'Aprobación y Dictamen formal de Presidencia CEI',
          };
        }

        await tx.sesionVotacion.update({
          where: { id: sesionVotacion.id },
          data: {
            estado: 'CerradaCompleta',
            dictamenPresidente: 'Aprobado',
            dictamenGlobal: 'Aprobado',
            documentoJson: doc ?? sesionVotacion.documentoJson,
            version: { increment: 1 },
          },
        });
      }

      // 3.5 Registrar en Historial general
      await tx.historial.create({
        data: {
          entidad: 'Expediente',
          entidadId: expediente.id,
          evento: 'EXPEDIENTE_APROBADO_PRESIDENCIA',
          descripcion: 'Aprobación y Dictamen formal emitido por Presidencia del CEI',
          usuarioId: presidenteId,
          expedienteId: expediente.id,
          solicitudId: expediente.solicitudId || undefined,
          metadata: {
            dictamen: 'APROBADO',
            fechaEmision: ahora.toISOString(),
            observaciones: dto?.observaciones || null,
            totalCalificaciones: completadas.length,
          },
        },
      });

      return {
        ok: true,
        mensaje: 'Expediente aprobado y dictaminado exitosamente por Presidencia.',
        expedienteId: expediente.id,
        codigoExpediente: expediente.codigo,
        estado: expedienteActualizado.estado,
        resultadoEvaluacion: 'APROBADO',
      };
    });
  }
}
