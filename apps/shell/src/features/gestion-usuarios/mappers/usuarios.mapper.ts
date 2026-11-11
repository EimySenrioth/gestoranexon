import {
  CategoriaUsuario,
  RolUsuario,
  UsuarioItem,
} from "../types/usuarios.types";

const COLORES_POR_ROL: Record<string, string> = {
  PRESIDENTE_CEI: "#5c2d91",
  VICEPRESIDENTE_CEI: "#0078d4",
  SECRETARIA_TECNICA_CEI: "#008272",
  SECRETARIA_TECNICA: "#008272",
  SECRETARIA_ADMINISTRATIVA_CEI: "#b4009e",
  SECRETARIA_ADMINISTRATIVA: "#b4009e",
  VOCAL_CEI: "#107c10",
  EVALUADOR: "#d83b01",
  ADMINISTRADOR: "#242424",
  SOLICITANTE: "#0078d4",
};

export function mapBackendUsuarioToUsuarioItem(
  raw: any,
  categoriaFallback: CategoriaUsuario = "EVALUADOR"
): UsuarioItem {
  const id = String(raw?.id ?? "");
  const nombre = String(raw?.nombre ?? "").trim();
  const apellido = String(raw?.apellido ?? "").trim();
  const nombreCompleto =
    String(raw?.nombreCompleto ?? `${nombre} ${apellido}`).trim() ||
    String(raw?.email ?? "Usuario");

  const rol = (raw?.rol ||
    (categoriaFallback === "EVALUADOR"
      ? "EVALUADOR"
      : categoriaFallback === "ADMINISTRADOR"
        ? "ADMINISTRADOR"
        : "SOLICITANTE")) as RolUsuario;

  const rolId =
    typeof raw?.rolId === "number"
      ? raw.rolId
      : categoriaFallback === "EVALUADOR"
        ? 2
        : categoriaFallback === "ADMINISTRADOR"
          ? 8
          : 1;

  const categoria: CategoriaUsuario =
    raw?.categoria === "SOLICITANTE" ||
    raw?.categoria === "EVALUADOR" ||
    raw?.categoria === "ADMINISTRADOR"
      ? raw.categoria
      : categoriaFallback;

  const creadoEn =
    typeof raw?.creadoEn === "string" && raw.creadoEn
      ? raw.creadoEn
      : new Date().toISOString();

  const fechaRegistro =
    typeof raw?.fechaRegistro === "string" && raw.fechaRegistro
      ? raw.fechaRegistro
      : creadoEn.split("T")[0];

  return {
    id,
    nombre: nombre || nombreCompleto,
    apellido,
    nombreCompleto,
    email: String(raw?.email ?? ""),
    passwordEnmascarada:
      typeof raw?.passwordEnmascarada === "string" &&
      raw.passwordEnmascarada.trim().length > 0 &&
      !raw.passwordEnmascarada.includes("••")
        ? raw.passwordEnmascarada.trim()
        : typeof raw?.password === "string" && raw.password.trim().length > 0
          ? raw.password.trim()
          : "Estancia2026!#",
    categoria,
    rolId,
    rol,
    rolEtiqueta: String(
      raw?.rolEtiqueta ??
        (categoria === "EVALUADOR" ? "Evaluador CEI" : "Solicitante")
    ),
    habilitado:
      typeof raw?.habilitado === "boolean"
        ? raw.habilitado
        : Boolean(raw?.activo ?? true),
    avatarColor:
      typeof raw?.avatarColor === "string" && raw.avatarColor
        ? raw.avatarColor
        : COLORES_POR_ROL[rol] || "#0078d4",
    iniciales:
      typeof raw?.iniciales === "string" && raw.iniciales
        ? raw.iniciales
        : nombreCompleto.slice(0, 2).toUpperCase() || "US",
    creadoEn,
    fechaRegistro,
  };
}

