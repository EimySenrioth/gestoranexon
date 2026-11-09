export type CategoriaUsuario = "EVALUADOR" | "SOLICITANTE";

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
  email: string;
  passwordEnmascarada: string;
  categoria: CategoriaUsuario;
  rol: RolUsuario;
  rolEtiqueta: string;
  habilitado: boolean;
  avatarColor: string;
  iniciales: string;
  fechaRegistro: string;
  departamento?: string;
}

export interface FiltrosUsuarios {
  categoria: CategoriaUsuario;
  busqueda: string;
  soloHabilitados?: boolean;
}

