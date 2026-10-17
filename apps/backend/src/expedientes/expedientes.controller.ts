import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ExpedientesService } from './expedientes.service.js';
import { CreateTicketDto } from '../ticketmanager/dto/index.js';
import { JwtAuthGuard } from '../common/guards/index.js';
import { CurrentUser } from '../common/decorators/index.js';

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
   * Lista los expedientes del solicitante autenticado.
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
