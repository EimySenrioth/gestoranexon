"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

interface EvaluacionIframeContainerProps {
  iframeSrc: string;
}

/**
 * Contenedor interactivo del iframe de evaluación.
 * Escucha los mensajes emitidos por el microfrontend Angular para:
 * 1. Cancelar evaluación y retornar a la tabla principal (/homeview2).
 * 2. Finalizar evaluación exitosa y retornar a la tabla principal.
 */
export function EvaluacionIframeContainer({ iframeSrc }: EvaluacionIframeContainerProps) {
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validar origen o tipo de mensaje
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "EVALUACION_CANCELADA") {
        console.log("[EvaluacionIframeContainer] Evento EVALUACION_CANCELADA recibido. Redirigiendo a la tabla principal...");
        router.push("/homeview2");
        if (typeof window !== "undefined") {
          window.location.href = "/homeview2";
        }
      } else if (data.type === "EVALUACION_FINALIZADA") {
        console.log("[EvaluacionIframeContainer] Evento EVALUACION_FINALIZADA recibido. Redirigiendo a la tabla principal...");
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

  return (
    <iframe
      src={iframeSrc}
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
