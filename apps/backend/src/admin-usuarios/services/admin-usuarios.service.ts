import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { RefreshTokenService } from '../../usermanagement/refreshtoken/refresh-token.service.js';
import {
  QueryAdminUsuariosCursorDto,
  CreateAdminUsuarioDto,
  UpdateAdminUsuarioDto,
  ToggleEstadoUsuarioDto,
  ChangePasswordUsuarioDto,
  PASSWORD_COMPLEJA_REGEX,
  PASSWORD_COMPLEJA_MSG,
  TablaUsuariosCursorResponseDto,
  ConteosCategoriasDto,
  AdminUsuarioFilaDto,
  RolDisponibleDto,
  CategoriaUsuarioAdmin,
} from '../dto/index.js';
import {
  mapPrismaUsuarioToAdminFila,
  ROLES_EVALUADORES_IDS,
  ROLES_SOLICITANTES_IDS,
  ROLES_ADMINISTRADORES_IDS,
  ROLES_CREACION_PERMITIDOS_IDS,
} from '../mappers/admin-usuario.mapper.js';

@Injectable()
export class AdminUsuariosService {
  private readonly logger = new Logger(AdminUsuariosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  /**
   * Construye la condición WHERE de Prisma para filtrar por categoría (EVALUADOR o SOLICITANTE),
   * texto de búsqueda y estado habilitado.
   */
  private construirWhereCategoria(
    categoria: CategoriaUsuarioAdmin,
    search?: string,
    soloHabilitados?: boolean,
  ) {
    const roleIds =
      categoria === 'EVALUADOR'
        ? ROLES_EVALUADORES_IDS
        : categoria === 'ADMINISTRADOR'
          ? ROLES_ADMINISTRADORES_IDS
          : ROLES_SOLICITANTES_IDS;

    const where: any = {
      roles: {
        some: {
          rolId: { in: roleIds },
        },
      },
    };

    if (typeof soloHabilitados === 'boolean') {
      where.activo = soloHabilitados;
    }

    const term = search?.trim();
    if (term) {
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { apellido: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        {
          roles: {
            some: {
              rol: {
                OR: [
                  { nombre: { contains: term, mode: 'insensitive' } },
                  { codigo: { contains: term, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
    }

    return where;
  }

  /**
   * Lista usuarios de la categoría indicada empleando paginación basada en cursor (Keyset Pagination)
   * sin usar offset numérico.
   */
  async listarConCursor(
    query: QueryAdminUsuariosCursorDto,
  ): Promise<TablaUsuariosCursorResponseDto> {
    const categoria: CategoriaUsuarioAdmin =
      query.categoria === 'SOLICITANTE'
        ? 'SOLICITANTE'
        : query.categoria === 'ADMINISTRADOR'
          ? 'ADMINISTRADOR'
          : 'EVALUADOR';
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 8;
    const take = limit + 1;

    const where = this.construirWhereCategoria(
      categoria,
      query.search,
      query.soloHabilitados,
    );

    const whereEvaluadores = this.construirWhereCategoria('EVALUADOR');
    const whereSolicitantes = this.construirWhereCategoria('SOLICITANTE');
    const whereAdministradores = this.construirWhereCategoria('ADMINISTRADOR');

    // Validar que el cursor exista si fue proporcionado; si no existe, ignorarlo de forma segura
    let cursorValido: string | undefined = undefined;
    if (query.cursor && query.cursor.trim().length > 0) {
      const existeCursor = await this.prisma.usuario.findUnique({
        where: { id: query.cursor.trim() },
        select: { id: true },
      });
      if (existeCursor) {
        cursorValido = existeCursor.id;
      }
    }

    const [
      rows,
      totalCategoria,
      totalEvaluadores,
      totalSolicitantes,
      totalAdministradores,
    ] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        take,
        ...(cursorValido
          ? {
              cursor: { id: cursorValido },
              skip: 1,
            }
          : {}),
        include: {
          roles: {
            include: {
              rol: true,
            },
          },
        },
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.count({ where: whereEvaluadores }),
      this.prisma.usuario.count({ where: whereSolicitantes }),
      this.prisma.usuario.count({ where: whereAdministradores }),
    ]);

    const hasNextPage = rows.length > limit;
    const sliceRows = hasNextPage ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasNextPage && sliceRows.length > 0
        ? sliceRows[sliceRows.length - 1].id
        : null;

    const items = sliceRows.map((u) =>
      mapPrismaUsuarioToAdminFila(u, categoria),
    );

    return {
      items,
      pageInfo: {
        limit,
        nextCursor,
        hasNextPage,
        totalCategoria,
      },
      conteos: {
        totalEvaluadores,
        totalSolicitantes,
        totalAdministradores,
      },
    };
  }

  /**
   * Devuelve el conteo global de Evaluadores, Solicitantes y Administradores en la base de datos.
   */
  async obtenerResumenConteos(): Promise<ConteosCategoriasDto> {
    const whereEvaluadores = this.construirWhereCategoria('EVALUADOR');
    const whereSolicitantes = this.construirWhereCategoria('SOLICITANTE');
    const whereAdministradores = this.construirWhereCategoria('ADMINISTRADOR');

    const [
      totalEvaluadores,
      totalSolicitantes,
      totalAdministradores,
      totalActivos,
      totalInactivos,
    ] = await this.prisma.$transaction([
      this.prisma.usuario.count({ where: whereEvaluadores }),
      this.prisma.usuario.count({ where: whereSolicitantes }),
      this.prisma.usuario.count({ where: whereAdministradores }),
      this.prisma.usuario.count({ where: { activo: true } }),
      this.prisma.usuario.count({ where: { activo: false } }),
    ]);

    return {
      totalEvaluadores,
      totalSolicitantes,
      totalAdministradores,
      totalActivos,
      totalInactivos,
    };
  }

  /**
   * Lista el catálogo de roles disponibles para poblar el selector en el Flyout Drawer.
   */
  async listarRolesDisponibles(
    categoria?: CategoriaUsuarioAdmin,
  ): Promise<RolDisponibleDto[]> {
    const whereIds =
      categoria === 'EVALUADOR'
        ? ROLES_EVALUADORES_IDS
        : categoria === 'SOLICITANTE'
          ? ROLES_SOLICITANTES_IDS
          : categoria === 'ADMINISTRADOR'
            ? ROLES_ADMINISTRADORES_IDS
            : [
                ...ROLES_SOLICITANTES_IDS,
                ...ROLES_EVALUADORES_IDS,
                ...ROLES_ADMINISTRADORES_IDS,
              ];

    const roles = await this.prisma.rol.findMany({
      where: {
        id: { in: whereIds },
      },
      orderBy: { id: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      codigo: r.codigo,
      nombre: r.nombre,
      descripcion: r.descripcion,
      categoria: ROLES_ADMINISTRADORES_IDS.includes(r.id)
        ? 'ADMINISTRADOR'
        : ROLES_EVALUADORES_IDS.includes(r.id)
          ? 'EVALUADOR'
          : 'SOLICITANTE',
    }));
  }

  /**
   * Obtiene el detalle de un usuario específico por su ID.
   */
  async obtenerPorId(id: string): Promise<AdminUsuarioFilaDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException(`El usuario con ID "${id}" no existe.`);
    }

    return mapPrismaUsuarioToAdminFila(usuario);
  }

  /**
   * Separa un nombre completo en nombre y apellido si no se proporcionó apellido por separado.
   */
  private normalizarNombreYApellido(
    nombreRaw: string,
    apellidoRaw?: string,
  ): { nombre: string; apellido: string } {
    const nombreTrim = (nombreRaw || '').trim();
    const apellidoTrim = (apellidoRaw || '').trim();

    if (apellidoTrim.length > 0) {
      return { nombre: nombreTrim, apellido: apellidoTrim };
    }

    const partes = nombreTrim.split(/\s+/).filter(Boolean);
    if (partes.length <= 1) {
      return { nombre: nombreTrim, apellido: '' };
    }
    if (partes.length === 2) {
      return { nombre: partes[0], apellido: partes[1] };
    }
    // Si tiene prefijo académico (Dr., Dra., Mg., Lic., Ing.) + Nombre + Apellidos
    const tienePrefijo = /^(dr\.|dra\.|mg\.|lic\.|ing\.|bach\.|est\.)$/i.test(
      partes[0],
    );
    if (tienePrefijo && partes.length >= 3) {
      return {
        nombre: `${partes[0]} ${partes[1]}`,
        apellido: partes.slice(2).join(' '),
      };
    }

    const mitad = Math.ceil(partes.length / 2);
    return {
      nombre: partes.slice(0, mitad).join(' '),
      apellido: partes.slice(mitad).join(' '),
    };
  }

  /**
   * Resuelve el ID de rol a partir de rolId o rolCodigo.
   */
  private async resolverRolId(
    rolId?: number,
    rolCodigo?: string,
    defaultRolId: number = 1,
  ): Promise<number> {
    if (rolId) {
      const existe = await this.prisma.rol.findUnique({ where: { id: rolId } });
      if (!existe) {
        throw new BadRequestException(`El rol con ID ${rolId} no es válido.`);
      }
      return existe.id;
    }

    if (rolCodigo) {
      const porCodigo = await this.prisma.rol.findUnique({
        where: { codigo: rolCodigo.toUpperCase().trim() },
      });
      if (!porCodigo) {
        throw new BadRequestException(
          `El rol con código "${rolCodigo}" no existe.`,
        );
      }
      return porCodigo.id;
    }

    return defaultRolId;
  }

  /**
   * Crea un nuevo usuario desde la Consola de Administración.
   */
  async crearUsuario(
    dto: CreateAdminUsuarioDto,
    adminId?: string,
  ): Promise<AdminUsuarioFilaDto> {
    const emailNorm = dto.email.toLowerCase().trim();

    const existente = await this.prisma.usuario.findUnique({
      where: { email: emailNorm },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un usuario registrado con el correo electrónico "${emailNorm}".`,
      );
    }

    const { nombre, apellido } = this.normalizarNombreYApellido(
      dto.nombre,
      dto.apellido,
    );
    const rolId = await this.resolverRolId(dto.rolId, dto.rolCodigo, 1);

    if (!ROLES_CREACION_PERMITIDOS_IDS.includes(rolId)) {
      throw new BadRequestException(
        'Solo se permite crear cuentas con el rol de Solicitante o Administrador. Los 5 cargos del Comité de Ética (CEI) son plazas institucionales fijas.',
      );
    }

    const activo = dto.activo ?? true;
    const passwordGuardar =
      typeof dto.password === 'string' && dto.password.trim().length > 0
        ? dto.password.trim()
        : 'Estancia2026!#';

    if (!PASSWORD_COMPLEJA_REGEX.test(passwordGuardar)) {
      throw new BadRequestException(PASSWORD_COMPLEJA_MSG);
    }

    const nuevoUsuario = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.usuario.create({
        data: {
          email: emailNorm,
          nombre,
          apellido,
          password: passwordGuardar,
          activo,
          roles: {
            create: [{ rolId }],
          },
        },
        include: {
          roles: {
            include: {
              rol: true,
            },
          },
        },
      });

      await tx.historial.create({
        data: {
          entidad: 'Usuario',
          entidadId: creado.id,
          evento: 'ADMIN_USUARIO_CREADO',
          descripcion: `Usuario ${creado.email} creado desde la Consola de Administración`,
          usuarioId: adminId || null,
          metadata: {
            email: creado.email,
            rolId,
            activo,
          },
        },
      });

      return creado;
    });

    this.logger.log(
      `Usuario creado por administración: ${nuevoUsuario.email} (${nuevoUsuario.id})`,
    );

    return mapPrismaUsuarioToAdminFila(nuevoUsuario);
  }

  /**
   * Actualiza los datos y credenciales de un usuario desde el Flyout Drawer.
   */
  async actualizarUsuario(
    id: string,
    dto: UpdateAdminUsuarioDto,
    adminId?: string,
  ): Promise<AdminUsuarioFilaDto> {
    const usuarioActual = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        roles: {
          include: { rol: true },
        },
      },
    });

    if (!usuarioActual) {
      throw new NotFoundException(`El usuario con ID "${id}" no existe.`);
    }

    let emailNorm = usuarioActual.email;
    if (dto.email && dto.email.toLowerCase().trim() !== usuarioActual.email) {
      emailNorm = dto.email.toLowerCase().trim();
      const duplicado = await this.prisma.usuario.findUnique({
        where: { email: emailNorm },
      });
      if (duplicado && duplicado.id !== id) {
        throw new ConflictException(
          `El correo electrónico "${emailNorm}" ya está en uso por otra cuenta.`,
        );
      }
    }

    let nombre = usuarioActual.nombre;
    let apellido = usuarioActual.apellido;

    if (dto.nombre !== undefined) {
      const normalizado = this.normalizarNombreYApellido(
        dto.nombre,
        dto.apellido,
      );
      nombre = normalizado.nombre;
      apellido = normalizado.apellido;
    } else if (dto.apellido !== undefined) {
      apellido = dto.apellido.trim();
    }

    const nuevoRolId =
      dto.rolId !== undefined || dto.rolCodigo !== undefined
        ? await this.resolverRolId(dto.rolId, dto.rolCodigo)
        : undefined;

    const nuevoEstadoActivo =
      typeof dto.activo === 'boolean' ? dto.activo : usuarioActual.activo;

    // Si envía una nueva contraseña distinta de la máscara visual
    const actualizaPassword =
      typeof dto.password === 'string' &&
      dto.password.trim().length > 0 &&
      !dto.password.includes('••');

    const actualizado = await this.prisma.$transaction(async (tx) => {
      if (nuevoRolId !== undefined) {
        await tx.usuarioRol.deleteMany({ where: { usuarioId: id } });
        await tx.usuarioRol.create({
          data: {
            usuarioId: id,
            rolId: nuevoRolId,
          },
        });
      }

      const userUpd = await tx.usuario.update({
        where: { id },
        data: {
          email: emailNorm,
          nombre,
          apellido,
          activo: nuevoEstadoActivo,
          ...(actualizaPassword ? { password: dto.password!.trim() } : {}),
        },
        include: {
          roles: {
            include: { rol: true },
          },
        },
      });

      await tx.historial.create({
        data: {
          entidad: 'Usuario',
          entidadId: id,
          evento: 'ADMIN_USUARIO_ACTUALIZADO',
          descripcion: `Usuario ${userUpd.email} actualizado desde la Consola de Administración`,
          usuarioId: adminId || null,
          metadata: {
            email: userUpd.email,
            rolId: nuevoRolId,
            activo: nuevoEstadoActivo,
            passwordActualizada: actualizaPassword,
          },
        },
      });

      return userUpd;
    });

    // Si el usuario fue deshabilitado, revocar inmediatamente todas sus sesiones activas
    if (usuarioActual.activo && !nuevoEstadoActivo) {
      await this.refreshTokenService.revokeAllForUser(id).catch((err) => {
        this.logger.warn(
          `No se pudieron revocar tokens al desactivar usuario ${id}: ${err}`,
        );
      });
    }

    return mapPrismaUsuarioToAdminFila(actualizado);
  }

  /**
   * Habilita o inhabilita rápidamente un usuario y revoca sus tokens si pasa a inactivo.
   */
  async cambiarEstadoUsuario(
    id: string,
    dto: ToggleEstadoUsuarioDto,
    adminId?: string,
  ): Promise<AdminUsuarioFilaDto> {
    return this.actualizarUsuario(id, { activo: dto.activo }, adminId);
  }

  /**
   * Cambia la contraseña de un usuario desde la Consola de Administración,
   * actualizando usuarios.password y registrando el evento en historial.
   */
  async cambiarPasswordUsuario(
    id: string,
    dto: ChangePasswordUsuarioDto,
    adminId?: string,
  ): Promise<AdminUsuarioFilaDto> {
    const usuarioActual = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        roles: {
          include: { rol: true },
        },
      },
    });

    if (!usuarioActual) {
      throw new NotFoundException(`El usuario con ID "${id}" no existe.`);
    }

    const nuevaLimpia = (dto.nuevaPassword || '').trim();
    if (
      nuevaLimpia.includes('••') ||
      !PASSWORD_COMPLEJA_REGEX.test(nuevaLimpia)
    ) {
      throw new BadRequestException(PASSWORD_COMPLEJA_MSG);
    }

    if (
      dto.confirmarPassword !== undefined &&
      dto.confirmarPassword.trim() !== nuevaLimpia
    ) {
      throw new BadRequestException(
        'La nueva contraseña y su confirmación no coinciden.',
      );
    }

    const actualizado = await this.prisma.$transaction(async (tx) => {
      const userUpd = await tx.usuario.update({
        where: { id },
        data: {
          password: nuevaLimpia,
        },
        include: {
          roles: {
            include: { rol: true },
          },
        },
      });

      await tx.historial.create({
        data: {
          entidad: 'Usuario',
          entidadId: id,
          evento: 'ADMIN_USUARIO_PASSWORD_ACTUALIZADA',
          descripcion: `Contraseña de ${userUpd.email} actualizada desde la Consola de Administración`,
          usuarioId: adminId || null,
          metadata: {
            email: userUpd.email,
            revocarSesiones: Boolean(dto.revocarSesiones),
          },
        },
      });

      return userUpd;
    });

    if (dto.revocarSesiones) {
      await this.refreshTokenService.revokeAllForUser(id).catch((err) => {
        this.logger.warn(
          `No se pudieron revocar tokens tras cambio de contraseña de ${id}: ${err}`,
        );
      });
    }

    return mapPrismaUsuarioToAdminFila(actualizado);
  }
}

