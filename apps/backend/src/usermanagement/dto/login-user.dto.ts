import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  email: string;

  @IsOptional()
  @IsString()
  password?: string;
}
