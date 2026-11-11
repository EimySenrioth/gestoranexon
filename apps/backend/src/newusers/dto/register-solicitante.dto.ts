import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const REGISTRO_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

export const REGISTRO_PASSWORD_MSG =
  'Debe incluir mínimo 8 caracteres con mayúsculas, minúsculas, números y signos.';

export class RegisterSolicitanteDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MaxLength(150)
  nombre!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  apellido?: string;

  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: REGISTRO_PASSWORD_MSG })
  @MaxLength(100)
  @Matches(REGISTRO_PASSWORD_REGEX, { message: REGISTRO_PASSWORD_MSG })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  confirmarPassword?: string;
}

