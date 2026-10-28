import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class GuardarBorradorAnexoDto {
  @IsString()
  @IsNotEmpty()
  expedienteId!: string;

  @IsArray()
  @IsOptional()
  principiosEticos?: any[];

  @IsArray()
  @IsOptional()
  metodologiaRiesgos?: any[];

  @IsArray()
  @IsOptional()
  normativaLegal?: any[];

  @IsString()
  @IsOptional()
  dictamen?: string;

  @IsString()
  @IsOptional()
  observacionesGenerales?: string;
}
