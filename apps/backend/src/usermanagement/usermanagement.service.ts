import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { UserTokenService } from './usertoken/user-token.service.js';
import type { CreateUserDto, AssignRolesDto, LoginUserDto } from './dto/index.js';

// Modelo tipado de Usuario con relación a Roles del CEI
export interface UsuarioConRoles {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
  roles: Array<{
    rol: {
      id: number;
      codigo: string;
      nombre: string;
    };
  }>;
}

@Injectable()
export class UserManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userTokenService: UserTokenService,
  ) {}

  /**
   * Crea un nuevo usuario y le asigna roles (por defecto SOLICITANTE si no se indican).
   */
  async createUser(dto: CreateUserDto) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException(`El correo ${dto.email} ya está registrado.`);
    }

    const roleIds = dto.roles && dto.roles.length > 0 ? dto.roles : [1]; // 1 = Solicitante

    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        nombre: dto.nombre,
        apellido: dto.apellido,
        password: dto.password ?? '',
        roles: {
          create: roleIds.map((rolId) => ({ rolId })),
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

    return this.formatUserResponse(usuario);
  }

  /**
   * Lista todos los usuarios con sus roles asociados.
   */
  async findAll(filter?: { roleId?: number }) {
    const where = filter?.roleId
      ? { roles: { some: { rolId: filter.roleId } } }
      : {};

    const users = await this.prisma.usuario.findMany({
      where,
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });

    return users.map((u: UsuarioConRoles) => this.formatUserResponse(u));
  }

  /**
   * Obtiene la nómina de autoridades y miembros del Comité de Ética (roles 3 al 7).
   */
  async getComiteMembers() {
    const comiteRoleIds = [3, 4, 5, 6, 7]; // Presidente, Vicepresidente, Sec. Técnica, Sec. Admin, Vocal

    const members = await this.prisma.usuario.findMany({
      where: {
        activo: true,
        roles: {
          some: {
            rolId: { in: comiteRoleIds },
          },
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

    return members.map((m: UsuarioConRoles) => this.formatUserResponse(m));
  }

  /**
   * Obtiene un usuario por ID.
   */
  async findById(id: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    return this.formatUserResponse(user);
  }

  /**
   * Asigna o reemplaza los roles institucionales de un usuario.
   */
  async assignRoles(usuarioId: string, dto: AssignRolesDto) {
    await this.findById(usuarioId);

    // Transacción atómica: elimina previos y registra los nuevos
    await this.prisma.$transaction([
      this.prisma.usuarioRol.deleteMany({
        where: { usuarioId },
      }),
      this.prisma.usuarioRol.createMany({
        data: dto.roleIds.map((rolId) => ({ usuarioId, rolId })),
      }),
    ]);

    return this.findById(usuarioId);
  }

  /**
   * Autenticación básica y emisión de token JWT con resolución automática de homeView:
   * - Solicitante -> 'inicio' (Vista 1)
   * - Resto de roles -> 'homeview2' (Vista 2)
   */
  async login(dto: LoginUserDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        roles: {
          include: {
            rol: true,
          },
        },
      },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas o usuario inactivo.');
    }

    const roleCodes = user.roles.map((r: { rol: { codigo: string } }) => r.rol.codigo);

    return this.userTokenService.generateToken({
      id: user.id,
      email: user.email,
      nombre: `${user.nombre} ${user.apellido}`,
      roles: roleCodes,
    });
  }

  /**
   * Valida únicamente la existencia y estado activo del usuario.
   */
  async validateUser(dto: LoginUserDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || !user.activo) {
      throw new UnauthorizedException('Credenciales inválidas o usuario inactivo.');
    }

    return user;
  }

  /**
   * Formatea la respuesta para no exponer contraseñas y mostrar roles de forma amigable.
   */
  private formatUserResponse(user: UsuarioConRoles) {
    const roleCodes = user.roles?.map((r: { rol: { codigo: string } }) => r.rol.codigo) ?? [];
    const homeView = this.userTokenService.determineHomeView(roleCodes);

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      activo: user.activo,
      roles: user.roles?.map((r: any) => ({
        id: r.rol.id,
        codigo: r.rol.codigo,
        nombre: r.rol.nombre,
      })) ?? [],
      homeView, // 'inicio' o 'homeview2'
      creadoEn: user.creadoEn,
      actualizadoEn: user.actualizadoEn,
    };
  }
}
