/**
 * Servicio de Auto-Registro Público de Solicitantes
 * Conecta con POST /api/v1/newusers/register en el backend NestJS.
 */

import { apiClient } from "@/services/api.client";

export interface RegisterSolicitantePayload {
  nombre: string;
  apellido?: string;
  email: string;
  password: string;
  confirmarPassword?: string;
}

export interface RegisterSolicitanteResponse {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  rolId: 1;
  rolCodigo: "SOLICITANTE";
  rolEtiqueta: string;
  activo: boolean;
  creadoEn: string;
}

export async function registrarSolicitanteApi(
  payload: RegisterSolicitantePayload
): Promise<RegisterSolicitanteResponse> {
  return await apiClient.post<RegisterSolicitanteResponse>(
    "/api/v1/newusers/register",
    {
      nombre: payload.nombre.trim(),
      apellido: payload.apellido?.trim() || undefined,
      email: payload.email.trim().toLowerCase(),
      password: payload.password.trim(),
      confirmarPassword: payload.confirmarPassword?.trim() || undefined,
    }
  );
}

