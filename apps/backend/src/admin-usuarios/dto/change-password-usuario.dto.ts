import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const PASSWORD_COMPLEJA_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

export const PASSWORD_COMPLEJA_MSG =
  'La contraseña debe tener mínimo 8 caracteres e incluir al menos una mayúscula, una minúscula, un número y un signo o símbolo.';

export class ChangePasswordUsuarioDto {
  @IsString()
  @MinLength(8, {
    message: PASSWORD_COMPLEJA_MSG,
  })
  @MaxLength(100)
  @Matches(PASSWORD_COMPLEJA_REGEX, {
    message: PASSWORD_COMPLEJA_MSG,
  })
  nuevaPassword!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  confirmarPassword?: string;

  @IsOptional()
  @IsBoolean()
  revocarSesiones?: boolean;
}

