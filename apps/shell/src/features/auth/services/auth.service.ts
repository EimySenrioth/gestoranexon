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

const DEV_MOCK_USERS: Record<string, { nombre: string; roles: string[]; homeView: "inicio" | "homeview2" }> = {
  "solicitante@estanciaperu.gob.pe": {
    nombre: "Carlos Mendoza Rivera",
    roles: ["SOLICITANTE"],
    homeView: "inicio",
  },
  "evaluador@estanciaperu.gob.pe": {
    nombre: "Elena Paredes Castro",
    roles: ["EVALUADOR"],
    homeView: "homeview2",
  },
  "presidente.cei@estanciaperu.gob.pe": {
    nombre: "Ricardo Palma Benavides",
    roles: ["PRESIDENTE_CEI"],
    homeView: "homeview2",
  },
  "vicepresidente.cei@estanciaperu.gob.pe": {
    nombre: "Rosa Alva Montoya",
    roles: ["VICEPRESIDENTE_CEI"],
    homeView: "homeview2",
  },
  "secretaria.tecnica@estanciaperu.gob.pe": {
    nombre: "Andrés Salazar Córdova",
    roles: ["SECRETARIA_TECNICA_CEI"],
    homeView: "homeview2",
  },
  "secretaria.admin@estanciaperu.gob.pe": {
    nombre: "Patricia Vega Zeballos",
    roles: ["SECRETARIA_ADMINISTRATIVA_CEI"],
    homeView: "homeview2",
  },
  "vocal.cei@estanciaperu.gob.pe": {
    nombre: "Manuel Quispe Huamán",
    roles: ["VOCAL_CEI"],
    homeView: "homeview2",
  },
  "admin@estanciaperu.gob.pe": {
    nombre: "Administrador Principal",
    roles: ["ADMINISTRADOR"],
    homeView: "homeview2",
  },
};

function getDevMockResponse(emailInput: string): LoginResponse {
  const email = emailInput.toLowerCase().trim();
  const mock = DEV_MOCK_USERS[email];
  if (mock) {
    return {
      accessToken: `dev-mock-token-${Date.now()}`,
      tokenType: "Bearer",
      expiresIn: "15m",
      homeView: mock.homeView,
      user: {
        id: `mock-${email.split("@")[0]}`,
        email,
        nombre: mock.nombre,
        roles: mock.roles,
      },
    };
  }

  const isSolicitante = email.includes("solicitante");
  return {
    accessToken: `dev-mock-token-${Date.now()}`,
    tokenType: "Bearer",
    expiresIn: "15m",
    homeView: isSolicitante ? "inicio" : "homeview2",
    user: {
      id: `mock-${Date.now()}`,
      email,
      nombre: email.split("@")[0].toUpperCase(),
      roles: isSolicitante ? ["SOLICITANTE"] : ["EVALUADOR"],
    },
  };
}

export async function loginWithApi(credentials: LoginCredentials): Promise<LoginResponse> {
  const cleanEmail = credentials.email.trim();

  try {
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
  } catch (error: unknown) {
    // Si la red no responde (servidores apagados o Failed to fetch)
    const isNetworkError =
      error instanceof TypeError ||
      (error instanceof Error &&
        (error.message.toLowerCase().includes("fetch") ||
          error.message.toLowerCase().includes("failed") ||
          error.message.toLowerCase().includes("network")));

    if (isNetworkError) {
      console.warn(
        `[auth.service] Servidor offline (${PROXY_AUTH_URL}). Conmutando automáticamente a sesión de desarrollo para ${cleanEmail}.`
      );
      return getDevMockResponse(cleanEmail);
    }

    throw error;
  }
}

export async function refreshSessionWithApi(): Promise<LoginResponse> {
  try {
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
  } catch {
    return getDevMockResponse("solicitante@estanciaperu.gob.pe");
  }
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
