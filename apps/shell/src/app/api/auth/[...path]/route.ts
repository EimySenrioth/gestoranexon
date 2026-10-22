import { NextRequest, NextResponse } from "next/server";

const BACKEND_API =
  process.env.BACKEND_API_URL || "http://localhost:3000/api/v1/users";

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
    console.warn(`[Auth Proxy] Backend no disponible en ${targetUrl}.`);

    if (targetAction === "logout" || targetAction === "logout-all") {
      const res = NextResponse.json({ ok: true, message: "Sesión cerrada localmente" }, { status: 200 });
      res.cookies.delete("refresh_token");
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
