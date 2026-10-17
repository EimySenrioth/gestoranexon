import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export const TIPOS_INVESTIGACION = [
  'Tesis de pregrado',
  'Tesis de posgrado',
  'Proyecto de investigación docente',
  'Otro',
] as const;

export const TIPOS_FINANCIAMIENTO = ['Autofinanciado', 'UNTELS', 'Externo'] as const;

export const trimONull = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.trim() === '' || value.trim().toUpperCase() === 'NA'
      ? null
      : value.trim()
    : value;

export const limpiarLista = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((v) => (typeof v === 'string' ? v.trim() : v)).filter((v) => v !== '')
    : value;

export class CreateTicketDto {
  // ---------- Paso 1: Datos Generales ----------
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El título del proyecto es obligatorio' })
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(500, { message: 'El título no puede exceder los 500 caracteres' })
  titulo: string;

  @IsOptional()
  @Transform(limpiarLista)
  @IsArray()
  @ArrayMaxSize(20, { message: 'No se permiten más de 20 investigadores' })
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  investigadores?: string[];

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() !== '' ? value.trim() : 'NA',
  )
  @IsString()
  @MaxLength(100)
  unidadAcademica?: string;

  @IsOptional()
  @IsIn(TIPOS_INVESTIGACION, {
    message: 'tipoInvestigacion debe ser uno de los tipos permitidos',
  })
  tipoInvestigacion?: (typeof TIPOS_INVESTIGACION)[number];

  @ValidateIf((o) => o.tipoInvestigacion === 'Otro')
  @Transform(trimONull)
  @IsString()
  @IsNotEmpty({ message: 'Especifique el tipo de investigación cuando selecciona "Otro"' })
  @MaxLength(255)
  tipoInvestigacionOtro?: string;

  @IsOptional()
  @IsIn(TIPOS_FINANCIAMIENTO, {
    message: 'financiamiento debe ser Autofinanciado, UNTELS o Externo',
  })
  financiamiento?: (typeof TIPOS_FINANCIAMIENTO)[number];

  @ValidateIf((o) => o.financiamiento === 'Externo')
  @Transform(trimONull)
  @IsString()
  @IsNotEmpty({
    message: 'Especifique la fuente de financiamiento externo cuando selecciona "Externo"',
  })
  @MaxLength(255)
  financiamientoDetalle?: string;

  // fechaPresentacion: NO aceptada del cliente (la fija el servidor en submit)

  // ---------- Paso 2: Expediente ----------
  @IsOptional()
  @Transform(trimONull)
  @IsString()
  @MaxLength(100)
  codigoSolicitante?: string;

  @IsOptional()
  @Transform(trimONull)
  @IsString()
  @MaxLength(255)
  naturalezaProyecto?: string;

  @IsOptional()
  @Transform(limpiarLista)
  @IsArray()
  @ArrayMaxSize(50, { message: 'No se permiten más de 50 participantes' })
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  participantes?: string[];

  @IsOptional()
  @Transform(trimONull)
  @IsString()
  @MaxLength(100)
  modalidad?: string;

  @IsOptional()
  @Transform(trimONull)
  @IsString()
  @MaxLength(20000)
  planProyecto?: string;

  @IsOptional()
  @Transform(trimONull)
  @IsString()
  @MaxLength(20000)
  descripcion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoria?: string;

  @IsOptional()
  @IsString()
  tipoTramiteId?: string;
}

export class UpdateTicketDto extends PartialType(CreateTicketDto) {}
