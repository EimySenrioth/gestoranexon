export type CategoriaUsuario = "EVALUADOR" | "SOLICITANTE" | "ADMINISTRADOR";

export type RolUsuario =
  | "ADMINISTRADOR"
  | "PRESIDENTE_CEI"
  | "VICEPRESIDENTE_CEI"
  | "SECRETARIA_TECNICA_CEI"
  | "SECRETARIA_ADMINISTRATIVA_CEI"
  | "VOCAL_CEI"
  | "EVALUADOR"
  | "SOLICITANTE";

export interface UsuarioItem {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  passwordEnmascarada: string;
  categoria: CategoriaUsuario;
  rolId: number;
  rol: RolUsuario;
  rolEtiqueta: string;
  habilitado: boolean;
  avatarColor: string;
  iniciales: string;
  creadoEn: string;
  fechaRegistro: string;
}

export interface CursorPageInfo {
  limit: number;
  nextCursor: string | null;
  prevCursor: string | null;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalCategoria: number;
}

export interface ConteosCategoriasUsuarios {
  totalEvaluadores: number;
  totalSolicitantes: number;
  totalAdministradores: number;
  totalActivos?: number;
  totalInactivos?: number;
}

export interface TablaUsuariosCursorResponse {
  items: UsuarioItem[];
  pageInfo: {
    limit: number;
    nextCursor: string | null;
    hasNextPage: boolean;
    totalCategoria: number;
  };
  conteos: ConteosCategoriasUsuarios;
}

export interface RolDisponibleItem {
  id: number;
  codigo: RolUsuario;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaUsuario;
}

export interface FiltrosUsuarios {
  categoria: CategoriaUsuario;
  busqueda: string;
  soloHabilitados?: boolean;
}

export interface CrearUsuarioAdminPayload {
  nombre: string;
  apellido?: string;
  email: string;
  password?: string;
  rolId?: number;
  rolCodigo?: string;
  activo?: boolean;
}

export interface ActualizarUsuarioAdminPayload {
  nombre?: string;
  apellido?: string;
  email?: string;
  password?: string;
  rolId?: number;
  rolCodigo?: string;
  activo?: boolean;
}

export interface CambiarPasswordAdminPayload {
  nuevaPassword: string;
  confirmarPassword?: string;
  revocarSesiones?: boolean;
}
