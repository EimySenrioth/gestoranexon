import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  NotImplementedException,
  HttpCode,
} from '@nestjs/common';
import { TicketManagerService } from './ticketmanager.service.js';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CallbackEvaluacionDto,
  QueryTicketsDto,
} from './dto/index.js';
import {
  JwtAuthGuard,
  ServiceTokenGuard,
  type AuthenticatedUser,
} from '../common/guards/index.js';
import { CurrentUser } from '../common/decorators/index.js';


@Controller('api/v1/tickets')
export class TicketManagerController {
  constructor(private readonly ticketManagerService: TicketManagerService) {}

  /**
   * Crea un nuevo trámite en estado BORRADOR asignando correlativo TCK-YYYY-XXXX.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreateTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketManagerService.create(dto, userId);
  }

  /**
   * Lista tickets con paginación y filtros según permisos.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTicketsDto,
  ) {
    return this.ticketManagerService.findAll(user, query);
  }

  /**
   * Detalle de un ticket, documentos vigentes e historial.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ticketManagerService.findById(id, user);
  }

  /**
   * Actualiza datos generales y de expediente en estado BORRADOR.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  patch(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketManagerService.patch(id, dto, userId);
  }

  /**
   * Envía formalmente la solicitud a la mesa de entrada y genera el expediente.
   */
  @Post(':id/submit')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  submit(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketManagerService.submit(id, userId);
  }

  /**
   * Descarta y cancela una solicitud en estado BORRADOR.
   */
  @Post(':id/cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ticketManagerService.cancel(id, userId);
  }

  /**
   * Callback autenticado entre servicios (CEI -> Mesa de Entrada).
   */
  @Post(':id/callback-evaluacion')
  @HttpCode(200)
  @UseGuards(ServiceTokenGuard)
  callbackEvaluacion(
    @Param('id') id: string,
    @Body() dto: CallbackEvaluacionDto,
  ) {
    return this.ticketManagerService.callbackEvaluacion(id, dto);
  }

  // -------------------------------------------------------------
  // Stubs reservados (501 Not Implemented)
  // -------------------------------------------------------------
  @Post(':id/admit')
  @UseGuards(JwtAuthGuard)
  admit() {
    throw new NotImplementedException(
      'La admisión manual de tickets no está habilitada. El flujo actual genera el expediente automáticamente al enviar.',
    );
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  reject() {
    throw new NotImplementedException(
      'El rechazo administrativo directo está reservado para una fase posterior con triaje manual.',
    );
  }

  @Post(':id/extend-deadline')
  @UseGuards(JwtAuthGuard)
  extendDeadline() {
    throw new NotImplementedException('Prórroga de plazo no implementada en esta versión.');
  }

  @Post(':id/reconsider')
  @UseGuards(JwtAuthGuard)
  reconsider() {
    throw new NotImplementedException('Reconsideración no implementada en esta versión.');
  }
}
