import { IsOptional, IsString } from 'class-validator';

export class AprobarPresidenciaDto {
  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  resolucionUrl?: string;
}

