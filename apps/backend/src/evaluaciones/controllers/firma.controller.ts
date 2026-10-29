import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FirmaService } from '../services/firma.service.js';
import { JwtAuthGuard } from '../../common/guards/index.js';

@Controller('api/v1/evaluaciones/firmas')
export class FirmaController {
  constructor(private readonly firmaService: FirmaService) {}

  /**
   * Consulta la estampa probatoria, hash SHA-256 y comprobante visual de la firma de una evaluación.
   */
  @Get(':evaluacionId')
  @UseGuards(JwtAuthGuard)
  async obtenerFirma(@Param('evaluacionId') evaluacionId: string) {
    return this.firmaService.obtenerFirmaPorEvaluacion(evaluacionId);
  }
}

