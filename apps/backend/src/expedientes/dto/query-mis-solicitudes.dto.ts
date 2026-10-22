import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMisSolicitudesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El parámetro page debe ser un número entero' })
  @Min(1, { message: 'El parámetro page debe ser al menos 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El parámetro limit debe ser un número entero' })
  @Min(1, { message: 'El parámetro limit debe ser al menos 1' })
  @Max(50, { message: 'El parámetro limit no puede exceder 50' })
  limit?: number = 10;
}
