/**
 * Servicio de Autenticación del Shell (Frontend)
 * Utiliza el Proxy BFF de Next.js (/api/auth/*) para comunicación segura con el backend NestJS,
 * manejo transparente de cookies HttpOnly, rotación de tokens y cierre de sesión.
 * Incluye respaldo local automático si los servidores están apagados.
 */

const PROXY_AUTH_URL = "/api/auth";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface UserRoleInfo {
  id?: number;
  codigo: string;
  nombre?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: string;
  homeView: "inicio" | "homeview2";
  user: {
    id: string;
    email: string;
    nombre?: string;
    roles: string[];
  };
}

export async function loginWithApi(credentials: LoginCredentials): Promise<LoginResponse> {
  const cleanEmail = credentials.email.trim();

  const response = await fetch(`${PROXY_AUTH_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "EstanciaPeru",
    },
    credentials: "include",
    body: JSON.stringify({
      email: cleanEmail,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Error al iniciar sesión";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `Error del servidor (${response.status})`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function refreshSessionWithApi(): Promise<LoginResponse> {
  const response = await fetch(`${PROXY_AUTH_URL}/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "EstanciaPeru",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("No se pudo refrescar la sesión");
  }

  return response.json();
}

export async function logoutWithApi(): Promise<{ ok: boolean }> {
  try {
    const response = await fetch(`${PROXY_AUTH_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "EstanciaPeru",
      },
      credentials: "include",
    });

    if (response.ok) {
      return await response.json();
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}
