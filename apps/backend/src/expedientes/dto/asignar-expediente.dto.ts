import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class AsignarExpedienteDto {
  @IsString({ message: 'El ID del miembro del CEI debe ser un texto válido.' })
  @IsNotEmpty({ message: 'El ID del miembro del CEI es obligatorio.' })
  miembroCeiId: string;

  @IsOptional()
  @IsString({ message: 'Las notas de asignación deben ser texto.' })
  notas?: string;

  @IsOptional()
  @IsInt({ message: 'El plazo en días debe ser un número entero.' })
  @Min(1, { message: 'El plazo mínimo es de 1 día.' })
  plazoDias?: number;
}
