import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AdminUsuariosService } from '../services/admin-usuarios.service.js';
import {
  QueryAdminUsuariosCursorDto,
  CreateAdminUsuarioDto,
  UpdateAdminUsuarioDto,
  ToggleEstadoUsuarioDto,
  ChangePasswordUsuarioDto,
  type CategoriaUsuarioAdmin,
} from '../dto/index.js';
import { JwtAuthGuard, RolesGuard } from '../../common/guards/index.js';
import { CurrentUser, Roles } from '../../common/decorators/index.js';

@Controller('api/v1/admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR')
export class AdminUsuariosController {
  constructor(private readonly adminUsuariosService: AdminUsuariosService) {}

  /**
   * Lista usuarios paginados mediante cursor para las dos tablas de la consola de administración:
   * - categoria=EVALUADOR (Miembros y Evaluadores del CEI)
   * - categoria=SOLICITANTE (Usuarios Solicitantes / Investigadores)
   */
  @Get()
  async listarConCursor(@Query() query: QueryAdminUsuariosCursorDto) {
    return await this.adminUsuariosService.listarConCursor(query);
  }

  /**
   * Resumen rápido de conteos por categoría y estado.
   */
  @Get('resumen-conteos')
  async obtenerResumenConteos() {
    return await this.adminUsuariosService.obtenerResumenConteos();
  }

  /**
   * Catálogo de roles disponibles para asignación en el Flyout Drawer.
   */
  @Get('roles-disponibles')
  async listarRolesDisponibles(
    @Query('categoria') categoria?: CategoriaUsuarioAdmin,
  ) {
    return await this.adminUsuariosService.listarRolesDisponibles(categoria);
  }

  /**
   * Obtiene el detalle de un usuario específico por su ID.
   */
  @Get(':id')
  async obtenerPorId(@Param('id') id: string) {
    return await this.adminUsuariosService.obtenerPorId(id);
  }

  /**
   * Crea un nuevo usuario desde la consola de administración.
   */
  @Post()
  @HttpCode(201)
  async crearUsuario(
    @Body() dto: CreateAdminUsuarioDto,
    @CurrentUser('id') adminId: string,
  ) {
    return await this.adminUsuariosService.crearUsuario(dto, adminId);
  }

  /**
   * Actualiza los datos, rol, contraseña o estado de un usuario.
   */
  @Patch(':id')
  async actualizarUsuario(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUsuarioDto,
    @CurrentUser('id') adminId: string,
  ) {
    return await this.adminUsuariosService.actualizarUsuario(id, dto, adminId);
  }

  /**
   * Cambia rápidamente el estado habilitado/inhabilitado de un usuario.
   */
  @Patch(':id/estado')
  async cambiarEstadoUsuario(
    @Param('id') id: string,
    @Body() dto: ToggleEstadoUsuarioDto,
    @CurrentUser('id') adminId: string,
  ) {
    return await this.adminUsuariosService.cambiarEstadoUsuario(
      id,
      dto,
      adminId,
    );
  }

  /**
   * Cambia o restablece la contraseña de un usuario desde la consola de administración.
   */
  @Patch(':id/password')
  async cambiarPasswordUsuario(
    @Param('id') id: string,
    @Body() dto: ChangePasswordUsuarioDto,
    @CurrentUser('id') adminId: string,
  ) {
    return await this.adminUsuariosService.cambiarPasswordUsuario(
      id,
      dto,
      adminId,
    );
  }
}

