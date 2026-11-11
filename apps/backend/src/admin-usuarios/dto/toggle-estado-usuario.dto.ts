import { IsBoolean } from 'class-validator';

export class ToggleEstadoUsuarioDto {
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  activo: boolean;
}

