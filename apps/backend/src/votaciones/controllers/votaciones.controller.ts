import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VotacionesService } from '../services/votaciones.service.js';
import {
  EmitirVotoDto,
  EmitirDictamenPresidenteDto,
  CrearSesionVotacionDto,
} from '../dto/index.js';
import { JwtAuthGuard } from '../../common/guards/index.js';
import { CurrentUser } from '../../common/decorators/index.js';

@Controller('api/votaciones/sesiones')
export class VotacionesController {
  constructor(private readonly votacionesService: VotacionesService) {}

  /**
   * Inicia una nueva sesión de votación para un anexo y sus 5 evaluadores.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  iniciarSesion(
    @Body() dto: CrearSesionVotacionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.votacionesService.iniciarSesion(dto, userId);
  }

  /**
   * VOTO CIEGO: Retorna únicamente el conteo de avance numérico.
   */
  @Get(':id/progreso')
  @UseGuards(JwtAuthGuard)
  obtenerProgreso(@Param('id') sesionId: string) {
    return this.votacionesService.obtenerProgresoAnonimo(sesionId);
  }

  /**
   * Retorna el JSON consolidado completo (disponible tras el cierre o para el Presidente).
   */
  @Get(':id/resultado')
  @UseGuards(JwtAuthGuard)
  obtenerResultado(
    @Param('id') sesionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.votacionesService.obtenerResultadoCompleto(sesionId, userId);
  }

  /**
   * Emite el voto individual y observaciones de un evaluador asignado.
   */
  @Post(':id/voto')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  emitirVoto(
    @Param('id') sesionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: EmitirVotoDto,
  ) {
    return this.votacionesService.registrarVoto(sesionId, userId, dto);
  }

  /**
   * Emite el dictamen formal del Presidente del CEI (con fechaEmision).
   */
  @Post(':id/dictamen-presidente')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  emitirDictamenPresidente(
    @Param('id') sesionId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: EmitirDictamenPresidenteDto,
  ) {
    return this.votacionesService.registrarDictamenPresidente(sesionId, userId, dto);
  }

  /**
   * Consulta los eventos de auditoría y trazabilidad legal de la tabla 'historial'.
   */
  @Get(':id/eventos')
  @UseGuards(JwtAuthGuard)
  obtenerHistorialEventos(@Param('id') sesionId: string) {
    return this.votacionesService.obtenerHistorialEventos(sesionId);
  }
}
