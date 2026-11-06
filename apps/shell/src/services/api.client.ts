/**
 * Cliente HTTP Global (Shell BFF / Backend API)
 * Centraliza headers institucionales, manejo de cookies/tokens, renovación automática silenciosa y parseo de errores.
 */

import {
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  type SessionState,
} from "@/navigation/session/session.store";
import type { Role } from "@/navigation/registry/types";
import type { LoginResponse } from "@/features/auth/services/auth.service";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3000";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  _isRetry?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Mutex de refresco en vuelo para evitar llamadas concurrentes duplicadas
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessTokenSilently(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "EstanciaPeru",
        },
        credentials: "include",
      });

      if (!response.ok) {
        clearStoredSession();
        return null;
      }

      const data: LoginResponse = await response.json();
      if (!data?.accessToken) {
        clearStoredSession();
        return null;
      }

      const currentSession = loadStoredSession();

      const updatedSession: SessionState = {
        user: {
          id: data.user.id,
          email: data.user.email,
          nombre: data.user.nombre ?? currentSession.user?.nombre ?? "",
          roles: (data.user.roles || currentSession.roles) as Role[],
        },
        roles: (data.user.roles || currentSession.roles) as Role[],
        token: data.accessToken,
        homeView: data.homeView || currentSession.homeView,
      };

      saveStoredSession(updatedSession);
      return data.accessToken;
    } catch (err) {
      console.warn("[api.client] Falló la renovación automática de sesión:", err);
      clearStoredSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers, _isRetry, ...restOptions } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const session = typeof window !== "undefined" ? loadStoredSession() : null;
  const token = session?.token;

  const isFormData = typeof FormData !== "undefined" && restOptions.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    "X-Requested-With": "EstanciaPeru",
  };

  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...restOptions,
    headers: mergedHeaders,
    credentials: restOptions.credentials || "include",
  });

  if (!response.ok) {
    // Si recibimos 401 (token expirado) y no es un reintento ni un endpoint de auth
    const isAuthEndpoint =
      endpoint.includes("/auth/login") ||
      endpoint.includes("/auth/refresh") ||
      endpoint.includes("/auth/logout");

    if (response.status === 401 && !_isRetry && !isAuthEndpoint && typeof window !== "undefined") {
      const newToken = await refreshAccessTokenSilently();
      if (newToken) {
        // Reintentamos la petición original con el nuevo token
        return apiRequest<T>(endpoint, {
          ...options,
          _isRetry: true,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
      }
    }

    let errorMsg = `Error en la solicitud: ${response.status} ${response.statusText}`;
    let errorData: any = null;

    try {
      errorData = await response.json();
      if (Array.isArray(errorData?.message)) {
        errorMsg = errorData.message.join(", ");
      } else if (errorData?.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // Ignorar fallo de parseo JSON en errores HTTP 404/500 planos
    }

    if (response.status === 401 && typeof window !== "undefined") {
      clearStoredSession();
    }

    throw new ApiError(response.status, errorMsg, errorData);
  }

  // Si la respuesta es 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  postFormData: <T>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
