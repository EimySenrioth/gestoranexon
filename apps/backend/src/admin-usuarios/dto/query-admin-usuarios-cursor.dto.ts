import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import type { CategoriaUsuarioAdmin } from './admin-usuario-response.dto.js';

export class QueryAdminUsuariosCursorDto {
  @IsOptional()
  @IsIn(['EVALUADOR', 'SOLICITANTE', 'ADMINISTRADOR'])
  categoria?: CategoriaUsuarioAdmin = 'EVALUADOR';

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 8;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  soloHabilitados?: boolean;
}

