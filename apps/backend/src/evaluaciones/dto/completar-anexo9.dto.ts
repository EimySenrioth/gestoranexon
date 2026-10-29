import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsIn,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrarFirmaDto } from './registrar-firma.dto.js';

export class CriterioItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsBoolean()
  cumple!: boolean;

  @IsString()
  @IsOptional()
  observaciones?: string;
}

export class CompletarAnexo9Dto {
  @IsString()
  @IsNotEmpty()
  expedienteId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioItemDto)
  principiosEticos!: CriterioItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioItemDto)
  metodologiaRiesgos!: CriterioItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioItemDto)
  normativaLegal!: CriterioItemDto[];

  @IsString()
  @IsIn(['aprobado', 'aprobado_observaciones', 'no_aprobado'])
  dictamen!: 'aprobado' | 'aprobado_observaciones' | 'no_aprobado';

  @IsString()
  @IsOptional()
  observacionesGenerales?: string;

  @ValidateNested()
  @Type(() => RegistrarFirmaDto)
  firma!: RegistrarFirmaDto;
}
