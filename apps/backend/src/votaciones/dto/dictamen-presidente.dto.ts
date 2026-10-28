import { IsEnum } from 'class-validator';
import type { VeredictoEvaluador } from '../domain/models/sesion-votacion.model.js';

export class EmitirDictamenPresidenteDto {
  @IsEnum(['Aprobado', 'AprobadoConObservaciones', 'NoAprobado'], {
    message: 'El resultado debe ser Aprobado, AprobadoConObservaciones o NoAprobado',
  })
  resultado: VeredictoEvaluador;
}
