import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AnexoEvaluacionService } from '../services/anexo-evaluacion.service.js';
import { CompletarAnexo9Dto, GuardarBorradorAnexoDto } from '../dto/index.js';
import { JwtAuthGuard } from '../../common/guards/index.js';
import { EvaluationTokenGuard } from '../guards/evaluation-token.guard.js';
import { CurrentUser } from '../../common/decorators/index.js';

@Controller('api/v1/evaluaciones/anexo')
export class AnexoEvaluacionController {
  constructor(private readonly anexoService: AnexoEvaluacionService) {}

  /**
   * Obtiene el estado actual del Anexo N°9 (Borrador guardado previamente o versión firmada).
   * Protegido por doble token: JWT de sesión y Token de evaluación del expediente.
   */
  @Get(':expedienteId')
  @UseGuards(JwtAuthGuard, EvaluationTokenGuard)
  async obtenerEstado(
    @Param('expedienteId') expedienteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.anexoService.obtenerEstadoAnexo(expedienteId, userId);
  }

  /**
   * Guarda un borrador parcial del Anexo N°9 sin firmar.
   */
  @Post('borrador')
  @UseGuards(JwtAuthGuard, EvaluationTokenGuard)
  @HttpCode(HttpStatus.OK)
  async guardarBorrador(
    @Body() dto: GuardarBorradorAnexoDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.anexoService.guardarBorrador(userId, dto);
  }

  /**
   * Finaliza la evaluación del Anexo N°9 con firma digital y registro formal.
   */
  @Post('completar')
  @UseGuards(JwtAuthGuard, EvaluationTokenGuard)
  @HttpCode(HttpStatus.OK)
  async completarAnexo(
    @Body() dto: CompletarAnexo9Dto,
    @CurrentUser('id') userId: string,
    @Req() req: any,
  ) {
    const tokenJti = req.evaluationContext?.jti || 'unknown';
    const ipAddress =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      undefined;
    const userAgent = req.headers?.['user-agent'] || undefined;

    return this.anexoService.completarAnexo(userId, tokenJti, dto, {
      ipAddress,
      userAgent,
    });
  }
}
