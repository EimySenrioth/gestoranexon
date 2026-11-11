import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PASSWORD_COMPLEJA_MSG,
  PASSWORD_COMPLEJA_REGEX,
} from './change-password-usuario.dto.js';

export class CreateAdminUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  nombre: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: PASSWORD_COMPLEJA_MSG })
  @Matches(PASSWORD_COMPLEJA_REGEX, { message: PASSWORD_COMPLEJA_MSG })
  password?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rolId?: number;

  @IsOptional()
  @IsString()
  rolCodigo?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

