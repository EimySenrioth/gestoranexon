"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStoredSession } from "@/navigation/session/session.store";
import { iniciarSesionEvaluacion } from "../services/evaluacion.service";

interface EvaluacionIframeContainerProps {
  iframeSrc?: string;
  initialToken?: string;
  expedienteId?: string;
}

/**
 * Contenedor interactivo del iframe de evaluación.
 * 1. Si no vino un token de evaluación en la URL pero sí un expedienteId, solicita automáticamente
 *    el token contextual de evaluación al backend usando la sesión activa del Shell.
 * 2. Pasa el token contextual (token) y el JWT de sesión (accessToken) al iframe Angular.
 * 3. Escucha los eventos postMessage para redirigir al cancelar o finalizar.
 */
export function EvaluacionIframeContainer({
  iframeSrc: explicitSrc,
  initialToken = "",
  expedienteId = "",
}: EvaluacionIframeContainerProps) {
  const router = useRouter();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(
    explicitSrc || null
  );

  useEffect(() => {
    if (explicitSrc) {
      setResolvedUrl(explicitSrc);
      return;
    }

    let cancelled = false;

    async function buildIframeUrl() {
      const session = loadStoredSession();
      const accessToken = session?.token || "";
      let evalToken = initialToken;

      if (!evalToken && expedienteId && accessToken) {
        try {
          const sesionEval = await iniciarSesionEvaluacion(expedienteId);
          if (sesionEval?.token) {
            evalToken = sesionEval.token;
          }
        } catch (err) {
          console.warn(
            "[EvaluacionIframeContainer] No se pudo emitir token contextual automático:",
            err
          );
        }
      }

      if (cancelled) return;

      const queryParams = new URLSearchParams();
      if (evalToken) queryParams.set("token", evalToken);
      if (accessToken) queryParams.set("accessToken", accessToken);
      if (expedienteId) queryParams.set("expedienteId", expedienteId);

      const qs = queryParams.toString();
      setResolvedUrl(
        qs ? `http://localhost:4202?${qs}` : "http://localhost:4202"
      );
    }

    buildIframeUrl();

    return () => {
      cancelled = true;
    };
  }, [explicitSrc, initialToken, expedienteId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "EVALUACION_CANCELADA") {
        console.log(
          "[EvaluacionIframeContainer] Evento EVALUACION_CANCELADA recibido. Redirigiendo a la tabla principal..."
        );
        router.push("/homeview2");
        if (typeof window !== "undefined") {
          window.location.href = "/homeview2";
        }
      } else if (data.type === "EVALUACION_FINALIZADA") {
        console.log(
          "[EvaluacionIframeContainer] Evento EVALUACION_FINALIZADA recibido. Redirigiendo a la tabla principal..."
        );
        router.push("/homeview2");
        if (typeof window !== "undefined") {
          window.location.href = "/homeview2";
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router]);

  if (!resolvedUrl) {
    return (
      <div className="w-full h-full flex-1 flex items-center justify-center text-white/80 font-medium">
        Preparando sesión de evaluación...
      </div>
    );
  }

  return (
    <iframe
      src={resolvedUrl}
      title="Microfrontend de Evaluación Angular"
      className="w-full h-full flex-1 border-none bg-transparent"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        display: "block",
        border: "none",
      }}
    />
  );
}
