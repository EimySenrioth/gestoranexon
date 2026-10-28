import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CriterioInputDto {
  @IsString()
  id: string;

  @IsOptional()
  cumple?: boolean;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CriteriosAnexoInputDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioInputDto)
  principiosEticos: CriterioInputDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioInputDto)
  normativaLegal: CriterioInputDto[];
}

export class CrearSesionVotacionDto {
  @IsString()
  expedienteId: string;

  @IsString()
  anexoId: string;

  @IsString()
  presidenteCeiId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  evaluadoresAsignados: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CriteriosAnexoInputDto)
  criteriosAnexo?: CriteriosAnexoInputDto;
}
