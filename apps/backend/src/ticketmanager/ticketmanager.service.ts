import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { Prisma, EstadoTicket } from '@prisma/client';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CallbackEvaluacionDto,
  QueryTicketsDto,
} from './dto/index.js';
import type { AuthenticatedUser } from '../common/guards/jwt-auth.guard.js';
import {
  DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS,
  ROLES_CEI,
} from '../common/constants/index.js';
import {
  siguienteCorrelativo,
  formatearCorrelativo,
} from '../common/utils/correlativo.util.js';
import {
  calcularClaveDuplicidad,
  normalizarCondicionales,
} from '../common/utils/duplicidad.util.js';
import {
  esViolacionUnica,
  esErrorConexionBD,
} from '../common/utils/db-error.util.js';
import {
  MOCK_DEV_TICKETS,
  MOCK_DEV_HISTORIAL,
  MOCK_DEV_EXPEDIENTES,
  MOCK_DEV_SECUENCIAS,
  devSiguienteCorrelativo,
} from './mocks/ticket-dev.store.js';

// Re-exports para retrocompatibilidad total con tests y consumidores existentes
export {
  DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS,
  ROLES_CEI,
  siguienteCorrelativo,
  formatearCorrelativo,
  calcularClaveDuplicidad,
  normalizarCondicionales,
  MOCK_DEV_TICKETS,
  MOCK_DEV_HISTORIAL,
  MOCK_DEV_EXPEDIENTES,
  MOCK_DEV_SECUENCIAS,
};


@Injectable()
export class TicketManagerService {
  private readonly logger = new Logger(TicketManagerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo trámite en estado BORRADOR asignando correlativo TCK-YYYY-XXXX de forma atómica.
   */
  async create(dto: CreateTicketDto, solicitanteId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const anio = new Date().getFullYear();
        const num = await siguienteCorrelativo(tx, `TCK-${anio}`);
        const codigo = formatearCorrelativo('TCK', anio, num);

        const dataLimpia = normalizarCondicionales(dto);
        const { tieneAudioAsunto, archivosAsuntoInfo, ...ticketCampos } = dataLimpia;

        const ticket = await tx.ticket.create({
          data: {
            ...ticketCampos,
            codigo,
            solicitanteId,
            estado: 'BORRADOR',
            metadata: {
              asuntoPedido: {
                tieneAudio: Boolean(tieneAudioAsunto),
                totalArchivos: Array.isArray(archivosAsuntoInfo) ? archivosAsuntoInfo.length : 0,
                archivos: Array.isArray(archivosAsuntoInfo) ? archivosAsuntoInfo : [],
              },
            },
          },
        });

        await tx.ticketHistorial.create({
          data: {
            ticketId: ticket.id,
            estadoNuevo: 'BORRADOR',
            accion: 'CREATE',
            usuarioId: solicitanteId,
          },
        });

        return ticket;
      });
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Creando ticket en memoria.`);

      const anio = new Date().getFullYear();
      const codigo = devSiguienteCorrelativo('TCK', anio);
      const dataLimpia = normalizarCondicionales(dto);
      const ticketId = `tck_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();

      const mockTicket = {
        id: ticketId,
        codigo,
        solicitanteId,
        estado: 'BORRADOR' as EstadoTicket,
        unidadAcademica: dataLimpia.unidadAcademica ?? 'NA',
        titulo: dataLimpia.titulo,
        investigadores: dataLimpia.investigadores,
        tipoInvestigacion: dataLimpia.tipoInvestigacion,
        tipoInvestigacionOtro: dataLimpia.tipoInvestigacionOtro ?? null,
        financiamiento: dataLimpia.financiamiento,
        financiamientoDetalle: dataLimpia.financiamientoDetalle ?? null,
        codigoSolicitante: dataLimpia.codigoSolicitante ?? null,
        claveDuplicidad: null,
        fechaPresentacion: null,
        expedienteId: null,
        tipoTramiteId: dataLimpia.tipoTramiteId ?? null,
        asignadoAId: null,
        resultadoEvaluacionExterna: null,
        calificacionExternaJson: null,
        fechaRecepcionEvaluacion: null,
        cerradoEn: null,
        creadoEn: now,
        actualizadoEn: now,
        documentos: [],
      };

      MOCK_DEV_TICKETS.set(ticketId, mockTicket);
      MOCK_DEV_HISTORIAL.set(ticketId, [
        {
          id: `hist_${Date.now()}`,
          ticketId,
          estadoAnterior: null,
          estadoNuevo: 'BORRADOR',
          accion: 'CREATE',
          usuarioId: solicitanteId,
          metadata: null,
          creadoEn: now,
        },
      ]);

      return mockTicket;
    }
  }

  /**
   * Lista tickets con paginación y filtros según el perfil del usuario:
   * - Solicitante: solo ve sus propias solicitudes.
   * - CEI: ve solicitudes en estado EXPEDIENTE_GENERADO (mesa de entrada completada).
   */
  async findAll(user: AuthenticatedUser, query: QueryTicketsDto) {
    const { pagina = 1, limite = 10, estado, busqueda } = query;
    const skip = (pagina - 1) * limite;

    const isCei = user.roles.some((r) =>
      ROLES_CEI.includes(r.toUpperCase() as any),
    );
    const isOnlySolicitante = !isCei;

    try {
      const where: Prisma.TicketWhereInput = {};

      if (isOnlySolicitante) {
        where.solicitanteId = user.id;
      } else {
        where.estado = 'EXPEDIENTE_GENERADO';
      }

      if (estado && Object.values(EstadoTicket).includes(estado as any)) {
        where.estado = estado as any;
      }

      if (busqueda && busqueda.trim()) {
        const q = busqueda.trim();
        where.OR = [
          { titulo: { contains: q, mode: 'insensitive' } },
          { codigo: { contains: q, mode: 'insensitive' } },
          { codigoSolicitante: { contains: q, mode: 'insensitive' } },
        ];
      }

      const [total, items] = await Promise.all([
        this.prisma.ticket.count({ where }),
        this.prisma.ticket.findMany({
          where,
          skip,
          take: limite,
          orderBy: { actualizadoEn: 'desc' },
          include: {
            documentos: {
              where: { estado: { not: 'REEMPLAZADO' } },
            },
            solicitante: {
              select: { id: true, nombre: true, apellido: true, email: true },
            },
            expediente: {
              select: { id: true, codigo: true, estado: true },
            },
          },
        }),
      ]);

      return {
        items,
        total,
        pagina,
        limite,
        paginasTotales: Math.ceil(total / limite),
      };
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Listando tickets en memoria.`);

      let tickets = Array.from(MOCK_DEV_TICKETS.values());

      if (isOnlySolicitante) {
        tickets = tickets.filter((t) => t.solicitanteId === user.id);
      } else {
        tickets = tickets.filter((t) => t.estado === 'EXPEDIENTE_GENERADO');
      }

      if (estado) {
        tickets = tickets.filter((t) => t.estado === estado);
      }

      if (busqueda && busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        tickets = tickets.filter(
          (t) =>
            t.titulo?.toLowerCase().includes(q) ||
            t.codigo?.toLowerCase().includes(q) ||
            t.codigoSolicitante?.toLowerCase().includes(q),
        );
      }

      tickets.sort(
        (a, b) =>
          new Date(b.actualizadoEn).getTime() -
          new Date(a.actualizadoEn).getTime(),
      );

      const total = tickets.length;
      const paginados = tickets.slice(skip, skip + limite);

      return {
        items: paginados,
        total,
        pagina,
        limite,
        paginasTotales: Math.ceil(total / limite),
      };
    }
  }

  /**
   * Obtiene el detalle de un ticket con sus documentos vigentes e historial.
   */
  async findById(id: string, user: AuthenticatedUser) {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id },
        include: {
          documentos: {
            where: { estado: { not: 'REEMPLAZADO' } },
            orderBy: { version: 'desc' },
          },
          historial: {
            orderBy: { creadoEn: 'desc' },
            include: {
              usuario: { select: { id: true, nombre: true, apellido: true } },
            },
          },
          solicitante: {
            select: { id: true, nombre: true, apellido: true, email: true },
          },
          expediente: {
            select: { id: true, codigo: true, estado: true },
          },
        },
      });

      if (!ticket) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      const isOwner = ticket.solicitanteId === user.id;
      const isCei = user.roles.some((r) =>
        ROLES_CEI.includes(r.toUpperCase() as any),
      );

      if (isOwner) return ticket;
      if (isCei && ticket.estado === 'EXPEDIENTE_GENERADO') return ticket;

      throw new NotFoundException('Solicitud no encontrada');
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Consultando ticket en memoria.`);

      const ticket = MOCK_DEV_TICKETS.get(id);
      if (!ticket) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      const isOwner = ticket.solicitanteId === user.id;
      const isCei = user.roles.some((r) =>
        ROLES_CEI.includes(r.toUpperCase() as any),
      );

      if (!isOwner && !(isCei && ticket.estado === 'EXPEDIENTE_GENERADO')) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      const historial = MOCK_DEV_HISTORIAL.get(id) || [];
      const expediente = ticket.expedienteId
        ? MOCK_DEV_EXPEDIENTES.get(ticket.expedienteId)
        : null;

      return {
        ...ticket,
        documentos: (ticket.documentos || []).filter(
          (d: any) => d.estado !== 'REEMPLAZADO',
        ),
        historial,
        expediente,
      };
    }
  }

  /**
   * Actualiza los datos de un ticket en estado BORRADOR.
   */
  async patch(id: string, dto: UpdateTicketDto, solicitanteId: string) {
    const dataLimpia = normalizarCondicionales(dto);

    try {
      const { count } = await this.prisma.ticket.updateMany({
        where: {
          id,
          solicitanteId,
          estado: 'BORRADOR',
        },
        data: dataLimpia,
      });

      if (count === 0) {
        const existe = await this.prisma.ticket.findFirst({
          where: { id, solicitanteId },
          select: { estado: true },
        });
        if (!existe) {
          throw new NotFoundException('Solicitud no encontrada');
        }
        throw new ConflictException(
          `No se puede editar una solicitud en estado ${existe.estado}. Solo se permiten modificaciones en BORRADOR.`,
        );
      }

      return this.prisma.ticket.findUniqueOrThrow({
        where: { id },
        include: {
          documentos: { where: { estado: { not: 'REEMPLAZADO' } } },
        },
      });
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Actualizando ticket en memoria.`);

      const ticket = MOCK_DEV_TICKETS.get(id);
      if (!ticket || ticket.solicitanteId !== solicitanteId) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      if (ticket.estado !== 'BORRADOR') {
        throw new ConflictException(
          `No se puede editar una solicitud en estado ${ticket.estado}. Solo se permiten modificaciones en BORRADOR.`,
        );
      }

      Object.assign(ticket, dataLimpia, { actualizadoEn: new Date() });
      MOCK_DEV_TICKETS.set(id, ticket);

      return {
        ...ticket,
        documentos: (ticket.documentos || []).filter(
          (d: any) => d.estado !== 'REEMPLAZADO',
        ),
      };
    }
  }

  /**
   * Envía formalmente la solicitud a la mesa de entrada:
   * 1. Reclamo atómico (BORRADOR -> REGISTRADO) con cálculo de clave R6 y fijación de fechaPresentacion.
   * 2. Validación estricta de requisitos y los 4 documentos del paso de expediente.
   * 3. Creación inmediata del Expediente en la misma transacción (REGISTRADO -> EXPEDIENTE_GENERADO).
   */
  async submit(ticketId: string, solicitanteId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1. Lectura inicial para verificar estado y fecha de versión
        const actual = await tx.ticket.findFirst({
          where: { id: ticketId, solicitanteId },
          select: {
            estado: true,
            titulo: true,
            codigoSolicitante: true,
            actualizadoEn: true,
          },
        });

        if (!actual) {
          throw new NotFoundException('Solicitud no encontrada');
        }
        if (actual.estado !== 'BORRADOR') {
          throw new ConflictException(
            `La solicitud ya fue enviada previamente (estado actual: ${actual.estado})`,
          );
        }

        // 2. Reclamo atómico a prueba de doble clic y R6
        const { count } = await tx.ticket.updateMany({
          where: {
            id: ticketId,
            solicitanteId,
            estado: 'BORRADOR',
            actualizadoEn: actual.actualizadoEn,
          },
          data: {
            estado: 'REGISTRADO',
            claveDuplicidad: calcularClaveDuplicidad(
              actual.titulo,
              actual.codigoSolicitante,
            ),
            fechaPresentacion: new Date(),
          },
        });

        if (count === 0) {
          throw new ConflictException(
            'La solicitud ya fue enviada o fue modificada concurrentemente; recargue e intente nuevamente.',
          );
        }

        // 3. Validación de guardas de envío sobre estado congelado
        const ticketConDocs = await tx.ticket.findUniqueOrThrow({
          where: { id: ticketId },
          include: {
            documentos: { where: { estado: { not: 'REEMPLAZADO' } } },
            tipoTramite: { include: { requisitos: true } },
          },
        });

        this.validarGuardasEnvio(ticketConDocs);

        await tx.ticketHistorial.create({
          data: {
            ticketId,
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'REGISTRADO',
            accion: 'SUBMIT',
            usuarioId: solicitanteId,
          },
        });

        // 4. Paso 2: Generar expediente en la misma transacción atómica
        return this.generarExpedienteInternal(tx, ticketId);
      });
    } catch (e) {
      if (
        esViolacionUnica(e, 'ticket_solicitante_duplicidad_uniq', 'claveDuplicidad')
      ) {
        throw new ConflictException(
          'Ya tiene una solicitud activa con el mismo título de proyecto y código de solicitante',
        );
      }

      if (!esErrorConexionBD(e)) throw e;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Procesando submit en memoria.`);

      // Lógica en memoria replicando R1-R7
      const actual = MOCK_DEV_TICKETS.get(ticketId);
      if (!actual || actual.solicitanteId !== solicitanteId) {
        throw new NotFoundException('Solicitud no encontrada');
      }
      if (actual.estado !== 'BORRADOR') {
        throw new ConflictException(
          `La solicitud ya fue enviada previamente (estado actual: ${actual.estado})`,
        );
      }

      const claveDuplicidad = calcularClaveDuplicidad(
        actual.titulo,
        actual.codigoSolicitante,
      );

      // Verificación de unicidad R6 en memoria
      const existeDuplicado = Array.from(MOCK_DEV_TICKETS.values()).some(
        (t) =>
          t.id !== ticketId &&
          t.solicitanteId === solicitanteId &&
          t.claveDuplicidad === claveDuplicidad &&
          t.estado !== 'CANCELADO',
      );

      if (existeDuplicado) {
        throw new ConflictException(
          'Ya tiene una solicitud activa con el mismo título de proyecto y código de solicitante',
        );
      }

      const documentosVigentes = (actual.documentos || []).filter(
        (d: any) => d.estado !== 'REEMPLAZADO',
      );

      // Validación estricta de guardas (4 documentos obligatorios)
      this.validarGuardasEnvio({
        ...actual,
        documentos: documentosVigentes,
      });

      // Generar expediente
      const anio = new Date().getFullYear();
      const codigoExp = devSiguienteCorrelativo('EXP', anio);
      const expedienteId = `exp_mock_${Date.now()}`;
      const now = new Date();

      const mockExpediente = {
        id: expedienteId,
        codigo: codigoExp,
        estado: 'INICIADO',
        solicitudId: null,
        gestorId: null,
        creadoEn: now,
        actualizadoEn: now,
        documentos: documentosVigentes.map((d: any) => ({
          id: `doc_exp_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          nombre: d.nombreOriginal,
          url: d.storagePath,
          tipo: d.tipoDocumental,
          expedienteId,
          ticketDocumentoId: d.id,
          creadoEn: now,
        })),
      };

      MOCK_DEV_EXPEDIENTES.set(expedienteId, mockExpediente);

      actual.estado = 'EXPEDIENTE_GENERADO';
      actual.claveDuplicidad = claveDuplicidad;
      actual.fechaPresentacion = now;
      actual.expedienteId = expedienteId;
      actual.actualizadoEn = now;
      MOCK_DEV_TICKETS.set(ticketId, actual);

      const historialList = MOCK_DEV_HISTORIAL.get(ticketId) || [];
      historialList.push({
        id: `hist_${Date.now()}`,
        ticketId,
        estadoAnterior: 'BORRADOR',
        estadoNuevo: 'EXPEDIENTE_GENERADO',
        accion: 'CREATE_EXPEDIENTE',
        usuarioId: solicitanteId,
        metadata: { expedienteCodigo: codigoExp },
        creadoEn: now,
      });
      MOCK_DEV_HISTORIAL.set(ticketId, historialList);

      return mockExpediente;
    }
  }

  /**
   * Cancela un borrador descartado (BORRADOR -> CANCELADO).
   */
  async cancel(ticketId: string, solicitanteId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.ticket.updateMany({
          where: { id: ticketId, solicitanteId, estado: 'BORRADOR' },
          data: { estado: 'CANCELADO', cerradoEn: new Date() },
        });

        if (count === 0) {
          const t = await tx.ticket.findFirst({
            where: { id: ticketId, solicitanteId },
            select: { estado: true },
          });
          if (!t) throw new NotFoundException('Solicitud no encontrada');
          throw new ConflictException(
            `No se puede cancelar una solicitud en estado ${t.estado}. Solo se pueden cancelar borradores.`,
          );
        }

        await tx.ticketHistorial.create({
          data: {
            ticketId,
            estadoAnterior: 'BORRADOR',
            estadoNuevo: 'CANCELADO',
            accion: 'CANCEL',
            usuarioId: solicitanteId,
          },
        });

        return { id: ticketId, estado: 'CANCELADO' as const };
      });
    } catch (error) {
      if (!esErrorConexionBD(error)) throw error;
      this.logger.warn(`[DEV FALLBACK] Base de datos no disponible. Cancelando ticket en memoria.`);

      const ticket = MOCK_DEV_TICKETS.get(ticketId);
      if (!ticket || ticket.solicitanteId !== solicitanteId) {
        throw new NotFoundException('Solicitud no encontrada');
      }
      if (ticket.estado !== 'BORRADOR') {
        throw new ConflictException(
          `No se puede cancelar una solicitud en estado ${ticket.estado}. Solo se pueden cancelar borradores.`,
        );
      }

      ticket.estado = 'CANCELADO';
      ticket.cerradoEn = new Date();
      ticket.actualizadoEn = new Date();
      MOCK_DEV_TICKETS.set(ticketId, ticket);

      return { id: ticketId, estado: 'CANCELADO' as const };
    }
  }

  /**
   * Callback autenticado con X-Service-Token para registrar el dictamen del CEI.
   */
  async callbackEvaluacion(ticketId: string, dto: CallbackEvaluacionDto) {
    const { count } = await this.prisma.ticket.updateMany({
      where: {
        id: ticketId,
        estado: 'EXPEDIENTE_GENERADO',
        resultadoEvaluacionExterna: null,
      },
      data: {
        resultadoEvaluacionExterna: dto.resultado,
        calificacionExternaJson: dto.calificacionJson ?? undefined,
        fechaRecepcionEvaluacion: new Date(),
      },
    });

    if (count === 0) {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { estado: true, resultadoEvaluacionExterna: true },
      });
      if (!ticket) {
        throw new NotFoundException('Ticket no encontrado');
      }
      if (ticket.resultadoEvaluacionExterna !== null) {
        return {
          id: ticketId,
          mensaje: 'El resultado ya había sido registrado previamente',
          resultado: ticket.resultadoEvaluacionExterna,
        };
      }
      throw new ConflictException(
        `El ticket debe estar en estado EXPEDIENTE_GENERADO para recibir el consenso (estado actual: ${ticket.estado})`,
      );
    }

    await this.prisma.ticketHistorial.create({
      data: {
        ticketId,
        estadoNuevo: 'EXPEDIENTE_GENERADO',
        accion: 'RECEPCION_EVALUACION_CEI',
        usuarioId: null,
        metadata: { resultado: dto.resultado },
      },
    });

    return {
      id: ticketId,
      resultado: dto.resultado,
      registrado: true,
    };
  }

  /**
   * Valida las guardas de envío exigidas en el plan:
   * - Título mínimo 5 caracteres.
   * - Condicionales completos (Externo / Otro).
   * - Los 4 documentos del paso expediente deben existir y estar vigentes.
   */
  private validarGuardasEnvio(ticket: {
    titulo: string;
    financiamiento: string | null;
    financiamientoDetalle: string | null;
    tipoInvestigacion: string | null;
    tipoInvestigacionOtro: string | null;
    documentos: Array<{ tipoDocumental: string }>;
    tipoTramite?: { requisitos: Array<{ tipoDocumental: string; obligatorio: boolean }> } | null;
  }) {
    const errores: string[] = [];

    if (!ticket.titulo || ticket.titulo.trim().length < 5) {
      errores.push('El título debe tener al menos 5 caracteres');
    }
    if (
      ticket.financiamiento === 'Externo' &&
      (!ticket.financiamientoDetalle || !ticket.financiamientoDetalle.trim())
    ) {
      errores.push('Especifique la fuente de financiamiento externo');
    }
    if (
      ticket.tipoInvestigacion === 'Otro' &&
      (!ticket.tipoInvestigacionOtro || !ticket.tipoInvestigacionOtro.trim())
    ) {
      errores.push('Especifique el tipo de investigación');
    }

    // Exactamente los 4 documentos obligatorios del formulario de expediente
    const subidos = new Set(ticket.documentos.map((d) => d.tipoDocumental));
    const docsFaltantes = DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS.filter(
      (tipo) => !subidos.has(tipo),
    );

    if (docsFaltantes.length > 0) {
      errores.push(
        `Debe adjuntar los 4 documentos obligatorios del expediente. Faltan: ${docsFaltantes.join(', ')}`,
      );
    }

    // Requisitos adicionales del catálogo si existieran
    const faltantesCatalogo = (ticket.tipoTramite?.requisitos ?? [])
      .filter((r) => r.obligatorio && !subidos.has(r.tipoDocumental))
      .map((r) => r.tipoDocumental);

    if (errores.length > 0 || faltantesCatalogo.length > 0) {
      throw new UnprocessableEntityException({
        mensaje: 'La solicitud no cumple los requisitos de envío',
        errores,
        requisitosFaltantes: [...docsFaltantes, ...faltantesCatalogo],
      });
    }
  }

  /**
   * Función interna (sin ruta HTTP pública):
   * Crea el registro de Expediente en la base de datos y copia los documentos vigentes.
   */
  private async generarExpedienteInternal(
    tx: Prisma.TransactionClient,
    ticketId: string,
  ) {
    // R4: Reclamo idempotente
    const { count } = await tx.ticket.updateMany({
      where: { id: ticketId, estado: 'REGISTRADO', expedienteId: null },
      data: { estado: 'EXPEDIENTE_GENERADO' },
    });

    if (count === 0) {
      const existente = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: { expediente: true },
      });
      if (existente?.expediente) return existente.expediente;
      throw new ConflictException(
        'El ticket no está en un estado válido para generar expediente',
      );
    }

    // R7: Correlativo atómico
    const anio = new Date().getFullYear();
    const codigo = formatearCorrelativo(
      'EXP',
      anio,
      await siguienteCorrelativo(tx, `EXP-${anio}`),
    );

    // Crea el Expediente con los campos mínimos requeridos
    const expediente = await tx.expediente.create({
      data: {
        codigo,
        estado: 'INICIADO',
      },
    });

    // R3: Única relación FK en Ticket
    await tx.ticket.update({
      where: { id: ticketId },
      data: { expedienteId: expediente.id },
    });

    // R5: Copia los documentos vigentes hacia la tabla documentos del expediente
    const vigentes = await tx.ticketDocumento.findMany({
      where: { ticketId, estado: { not: 'REEMPLAZADO' } },
    });

    if (vigentes.length > 0) {
      await tx.documento.createMany({
        data: vigentes.map((d) => ({
          nombre: d.nombreOriginal,
          url: d.storagePath,
          tipo: d.tipoDocumental,
          expedienteId: expediente.id,
          ticketDocumentoId: d.id,
        })),
      });
    }

    await tx.ticketHistorial.create({
      data: {
        ticketId,
        estadoAnterior: 'REGISTRADO',
        estadoNuevo: 'EXPEDIENTE_GENERADO',
        accion: 'CREATE_EXPEDIENTE',
        usuarioId: null,
        metadata: { expedienteCodigo: codigo },
      },
    });

    return expediente;
  }
}
