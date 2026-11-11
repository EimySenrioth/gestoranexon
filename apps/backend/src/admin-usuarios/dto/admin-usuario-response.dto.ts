export type CategoriaUsuarioAdmin =
  | 'EVALUADOR'
  | 'SOLICITANTE'
  | 'ADMINISTRADOR';

export interface AdminUsuarioFilaDto {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  passwordEnmascarada: string;
  categoria: CategoriaUsuarioAdmin;
  rolId: number;
  rol: string;
  rolEtiqueta: string;
  habilitado: boolean;
  avatarColor: string;
  iniciales: string;
  creadoEn: string;
  fechaRegistro: string;
}

export interface CursorMetaDto {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
  totalCategoria: number;
}

export interface ConteosCategoriasDto {
  totalEvaluadores: number;
  totalSolicitantes: number;
  totalAdministradores: number;
  totalActivos?: number;
  totalInactivos?: number;
}

export interface TablaUsuariosCursorResponseDto {
  items: AdminUsuarioFilaDto[];
  pageInfo: CursorMetaDto;
  conteos: ConteosCategoriasDto;
}

export interface RolDisponibleDto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaUsuarioAdmin;
}

