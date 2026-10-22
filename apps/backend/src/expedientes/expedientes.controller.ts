import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ExpedientesService } from './expedientes.service.js';
import { CreateTicketDto } from '../ticketmanager/dto/index.js';
import { QueryMisSolicitudesDto } from './dto/query-mis-solicitudes.dto.js';
import { JwtAuthGuard, RolesGuard } from '../common/guards/index.js';
import { CurrentUser, Roles } from '../common/decorators/index.js';

@Controller('api/v1/expedientes')
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) {}

  /**
   * Endpoint dedicado para crear y almacenar un expediente en PostgreSQL.
   */
  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  async crear(
    @Body() dto: CreateTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.expedientesService.crearExpediente(dto, userId);
  }

  /**
   * Endpoint optimizado para el rol de Solicitante:
   * Entrega únicamente las columnas de la tabla (ID, Fecha, Finalizado, Evaluación, Progreso).
   * Paginado y protegido por JWT + Rol 'SOLICITANTE'.
   */
  @Get('mis-solicitudes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SOLICITANTE')
  async listarMisSolicitudes(
    @CurrentUser('id') userId: string,
    @Query() query: QueryMisSolicitudesDto,
  ) {
    return this.expedientesService.listarMisSolicitudes(userId, query);
  }

  /**
   * Lista TODOS los datos del expediente/trámite (sin proyección, incluye documentos completos).
   * NOTA: Este endpoint está reservado para los otros 4 roles (Comité / Mesa de Entrada / Gestión).
   * El rol Solicitante consume de forma eficiente y segura: GET /api/v1/expedientes/mis-solicitudes.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listar(@CurrentUser('id') userId: string) {
    return this.expedientesService.listarPorSolicitante(userId);
  }

  /**
   * Obtiene el detalle de un expediente específico.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async obtenerPorId(@Param('id') id: string) {
    return this.expedientesService.obtenerPorId(id);
  }
}

