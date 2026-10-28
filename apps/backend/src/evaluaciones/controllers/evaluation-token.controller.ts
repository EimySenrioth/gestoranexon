import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { EvaluationTokenService } from '../services/evaluation-token.service.js';
import { CreateEvaluationTokenDto, RevocarTokenDto } from '../dto/index.js';
import { JwtAuthGuard } from '../../common/guards/index.js';
import { CurrentUser } from '../../common/decorators/index.js';

@Controller('api/v1/evaluaciones/tokens')
export class EvaluationTokenController {
  constructor(private readonly tokenService: EvaluationTokenService) {}

  /**
   * Genera un token contextual de evaluación para el expediente y evaluador autenticado.
   * Disparado al presionar el botón "Continuar" en el modal de advertencia del Shell.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async generarToken(
    @Body() dto: CreateEvaluationTokenDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tokenService.generarToken(dto.expedienteId, userId);
  }

  /**
   * Revoca un token activo al hacer clic en Cancelar / Salir de la evaluación.
   */
  @Post('revocar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revocarToken(
    @Body() dto: RevocarTokenDto,
    @CurrentUser('id') userId: string,
    @Req() req: any,
  ) {
    const tokenToRevoke =
      dto.token ||
      req.headers['x-evaluation-token'] ||
      (req.query && req.query.token);

    return this.tokenService.revocarToken(tokenToRevoke, dto.motivo, userId);
  }
}
