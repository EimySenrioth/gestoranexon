import { IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export const RESULTADOS_EVALUACION = [
  'APROBADO',
  'APROBADO_CON_OBSERVACIONES',
  'NO_APROBADO',
] as const;

export class CallbackEvaluacionDto {
  @IsIn(RESULTADOS_EVALUACION, {
    message: 'El resultado debe ser APROBADO, APROBADO_CON_OBSERVACIONES o NO_APROBADO',
  })
  @IsNotEmpty({ message: 'El resultado de la evaluación es obligatorio' })
  resultado: (typeof RESULTADOS_EVALUACION)[number];

  @IsOptional()
  calificacionJson?: any;
}
