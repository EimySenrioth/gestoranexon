export class CreateUserDto {
  email: string;
  password?: string;
  nombre: string;
  apellido: string;
  roles?: number[]; // IDs de roles a asignar (ej: [1] o [3])
}
