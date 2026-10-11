import { NextRequest, NextResponse } from "next/server";

const BACKEND_API =
  process.env.BACKEND_API_URL || "http://localhost:3000/api/v1/users";

// Catálogo de respaldo para desarrollo offline
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

function getDevMockResponse(emailInput: string) {
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

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetAction = path.join("/");
  const targetUrl = `${BACKEND_API}/${targetAction}`;

  const requestCookie = req.headers.get("cookie") ?? "";
  let requestBody: any = null;

  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      requestBody = await req.json();
    } catch {
      requestBody = null;
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "EstanciaPeru", // Header para pasar CsrfGuard
        Cookie: requestCookie,
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    const responseData = await backendRes.text();
    const nextResponse = new NextResponse(responseData, {
      status: backendRes.status,
      headers: {
        "Content-Type": backendRes.headers.get("content-type") || "application/json",
      },
    });

    // Reenviar cualquier cookie Set-Cookie devuelta por el backend al navegador
    const setCookieHeaders = backendRes.headers.getSetCookie?.() || [];
    for (const cookieStr of setCookieHeaders) {
      nextResponse.headers.append("Set-Cookie", cookieStr);
    }

    return nextResponse;
  } catch (error) {
    // Si el backend en localhost:3000 está desconectado, aplicar fallback local
    console.warn(`[Auth Proxy] Backend no disponible en ${targetUrl}. Ejecutando fallback de desarrollo.`);

    if (targetAction === "login" && requestBody?.email) {
      const mockSession = getDevMockResponse(requestBody.email);
      const res = NextResponse.json(mockSession, { status: 200 });
      res.cookies.set("refresh_token", `mock-refresh-${Date.now()}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api",
        maxAge: 7 * 24 * 60 * 60,
      });
      return res;
    }

    if (targetAction === "logout" || targetAction === "logout-all") {
      const res = NextResponse.json({ ok: true, message: "Sesión cerrada localmente" }, { status: 200 });
      res.cookies.delete("refresh_token");
      return res;
    }

    if (targetAction === "refresh") {
      const res = NextResponse.json(
        {
          accessToken: `dev-refreshed-token-${Date.now()}`,
          tokenType: "Bearer",
          expiresIn: "15m",
          homeView: "inicio",
          user: { id: "mock-user", email: "dev@estanciaperu.gob.pe", roles: ["SOLICITANTE"] },
        },
        { status: 200 }
      );
      return res;
    }

    return NextResponse.json(
      { message: "Error al comunicar con el servicio de autenticación" },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
