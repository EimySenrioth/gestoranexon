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

export class FirmaEvaluadorDto {
  @IsString()
  @IsNotEmpty()
  firmaDataUrl!: string;

  @IsString()
  @IsOptional()
  firmadoEn?: string;

  @IsBoolean()
  @IsOptional()
  declaracionAceptada?: boolean;
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
  @Type(() => FirmaEvaluadorDto)
  firma!: FirmaEvaluadorDto;
}
