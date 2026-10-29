import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';

export class RegistrarFirmaDto {
  @IsString()
  @IsNotEmpty({ message: 'La firma digital en Base64 es obligatoria.' })
  @Matches(/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/, {
    message:
      'El campo firmaDataUrl debe ser una imagen codificada en formato DataURL Base64 válido (ej. data:image/png;base64,...).',
  })
  firmaDataUrl!: string;

  @IsString()
  @IsOptional()
  firmadoEn?: string;

  @IsBoolean()
  @IsOptional()
  declaracionAceptada?: boolean;
}

