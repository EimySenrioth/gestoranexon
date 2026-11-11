/**
 * Servicio de Administración de Usuarios (HomeView3)
 * Conecta con el backend NestJS (/api/v1/admin/usuarios) empleando
 * paginación por cursor (Keyset Pagination) sin datos simulados.
 */

import { apiClient } from "@/services/api.client";
import {
  ActualizarUsuarioAdminPayload,
  CambiarPasswordAdminPayload,
  CategoriaUsuario,
  ConteosCategoriasUsuarios,
  CrearUsuarioAdminPayload,
  RolDisponibleItem,
  TablaUsuariosCursorResponse,
  UsuarioItem,
} from "../types/usuarios.types";
import { mapBackendUsuarioToUsuarioItem } from "../mappers/usuarios.mapper";

export interface QueryUsuariosCursorParams {
  categoria: CategoriaUsuario;
  cursor?: string | null;
  limit?: number;
  search?: string;
  soloHabilitados?: boolean;
}

/**
 * Consulta una página de usuarios mediante cursor (sin offset) para la tabla indicada.
 */
export async function listarUsuariosAdminConCursor(
  params: QueryUsuariosCursorParams
): Promise<TablaUsuariosCursorResponse> {
  const limit = params.limit && params.limit > 0 ? params.limit : 8;
  const queryParams: Record<string, string | undefined> = {
    categoria: params.categoria,
    limit: String(limit),
    cursor: params.cursor || undefined,
    search: params.search?.trim() ? params.search.trim() : undefined,
    soloHabilitados:
      typeof params.soloHabilitados === "boolean"
        ? String(params.soloHabilitados)
        : undefined,
  };

  const data = await apiClient.get<TablaUsuariosCursorResponse>(
    "/api/v1/admin/usuarios",
    { params: queryParams }
  );

  const items = Array.isArray(data?.items)
    ? data.items.map((item) =>
        mapBackendUsuarioToUsuarioItem(item, params.categoria)
      )
    : [];

  return {
    items,
    pageInfo: {
      limit: data?.pageInfo?.limit ?? limit,
      nextCursor: data?.pageInfo?.nextCursor ?? null,
      hasNextPage: Boolean(data?.pageInfo?.hasNextPage),
      totalCategoria: data?.pageInfo?.totalCategoria ?? items.length,
    },
    conteos: {
      totalEvaluadores: data?.conteos?.totalEvaluadores ?? 0,
      totalSolicitantes: data?.conteos?.totalSolicitantes ?? 0,
      totalAdministradores: data?.conteos?.totalAdministradores ?? 0,
    },
  };
}

/**
 * Obtiene el resumen de conteos para las pestañas Evaluadores y Solicitantes.
 */
export async function obtenerResumenConteosUsuarios(): Promise<ConteosCategoriasUsuarios> {
  return await apiClient.get<ConteosCategoriasUsuarios>(
    "/api/v1/admin/usuarios/resumen-conteos"
  );
}

/**
 * Obtiene el catálogo de roles disponibles en base de datos para asignar en el Drawer.
 */
export async function listarRolesDisponiblesAdmin(
  categoria?: CategoriaUsuario
): Promise<RolDisponibleItem[]> {
  return await apiClient.get<RolDisponibleItem[]>(
    "/api/v1/admin/usuarios/roles-disponibles",
    {
      params: categoria ? { categoria } : undefined,
    }
  );
}

/**
 * Crea un nuevo usuario desde la consola de administración.
 */
export async function crearUsuarioAdmin(
  payload: CrearUsuarioAdminPayload
): Promise<UsuarioItem> {
  const raw = await apiClient.post<any>("/api/v1/admin/usuarios", payload);
  return mapBackendUsuarioToUsuarioItem(raw);
}

/**
 * Actualiza los datos, rol o estado de un usuario desde el Flyout Drawer.
 */
export async function actualizarUsuarioAdmin(
  id: string,
  payload: ActualizarUsuarioAdminPayload
): Promise<UsuarioItem> {
  const raw = await apiClient.patch<any>(
    `/api/v1/admin/usuarios/${encodeURIComponent(id)}`,
    payload
  );
  return mapBackendUsuarioToUsuarioItem(raw);
}

/**
 * Habilita o inhabilita rápidamente la cuenta de un usuario.
 */
export async function cambiarEstadoUsuarioAdmin(
  id: string,
  activo: boolean
): Promise<UsuarioItem> {
  const raw = await apiClient.patch<any>(
    `/api/v1/admin/usuarios/${encodeURIComponent(id)}/estado`,
    { activo }
  );
  return mapBackendUsuarioToUsuarioItem(raw);
}

/**
 * Cambia la contraseña de un usuario desde la consola de administración.
 */
export async function cambiarPasswordUsuarioAdmin(
  id: string,
  payload: CambiarPasswordAdminPayload
): Promise<UsuarioItem> {
  const raw = await apiClient.patch<any>(
    `/api/v1/admin/usuarios/${encodeURIComponent(id)}/password`,
    payload
  );
  return mapBackendUsuarioToUsuarioItem(raw);
}

