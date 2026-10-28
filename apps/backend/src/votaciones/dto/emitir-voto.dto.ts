import { IsEnum, IsBoolean, IsString, IsOptional } from 'class-validator';
import type { VeredictoEvaluador } from '../domain/models/sesion-votacion.model.js';

export class EmitirVotoDto {
  @IsEnum(['Aprobado', 'AprobadoConObservaciones', 'NoAprobado'], {
    message: 'El veredicto debe ser Aprobado, AprobadoConObservaciones o NoAprobado',
  })
  veredicto: VeredictoEvaluador;

  @IsBoolean()
  tieneObservacionesDocumentales: boolean;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
