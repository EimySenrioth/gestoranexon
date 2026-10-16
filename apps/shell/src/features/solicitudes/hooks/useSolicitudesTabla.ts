"use client";

import { useState, useEffect, useCallback } from "react";
import { SolicitudItem, MOCK_SOLICITUDES, ProgresoEstado } from "../types/tabla.types";
import { listarExpedientes, ExpedienteResponse } from "../services/expedientes.service";

interface UseSolicitudesTablaOptions {
  initialSolicitudes?: SolicitudItem[];
  onConsultarEstatus?: (solicitud: SolicitudItem) => void;
  onVerExpediente?: (solicitud: SolicitudItem) => void;
}

function mapExpedienteToSolicitudItem(exp: ExpedienteResponse): SolicitudItem {
  const isFinalizado =
    exp.estado === "APROBADA" || exp.estado === "RECHAZADA" ? "Si" : "NO";

  let evaluacionText: SolicitudItem["evaluacion"] = "En espera";
  if (exp.estado === "APROBADA") evaluacionText = "Aprobada";
  else if (exp.estado === "EN_REVISION") evaluacionText = "En revisión";
  else if (exp.estado === "ENVIADA") evaluacionText = "ENTREGADA";

  let progresoText: ProgresoEstado = "recibido";
  if (exp.estado === "EN_REVISION") progresoText = "en evaluación";
  else if (exp.estado === "APROBADA") progresoText = "dictaminado";

  return {
    id: exp.codigoExpediente || exp.codigo || exp.id,
    fecha: exp.creadoEn ? new Date(exp.creadoEn).toLocaleDateString() : new Date().toLocaleDateString(),
    finalizado: isFinalizado,
    evaluacion: evaluacionText,
    progreso: progresoText,
  };
}

export function useSolicitudesTabla({
  initialSolicitudes,
  onConsultarEstatus,
  onVerExpediente,
}: UseSolicitudesTablaOptions = {}) {
  const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>(
    initialSolicitudes || []
  );
  const [vista, setVista] = useState<"tabla" | "progreso" | "expediente">("tabla");
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudItem | null>(null);
  const [isLoading, setIsLoading] = useState(!initialSolicitudes);
  const [error, setError] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listarExpedientes();
      if (Array.isArray(data) && data.length > 0) {
        setSolicitudes(data.map(mapExpedienteToSolicitudItem));
      } else {
        // Fallback a los datos de prueba institucionales
        setSolicitudes(MOCK_SOLICITUDES);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar expedientes";
      setError(msg);
      setSolicitudes(MOCK_SOLICITUDES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialSolicitudes && initialSolicitudes.length > 0) return;
    cargarSolicitudes();
  }, [initialSolicitudes, cargarSolicitudes]);

  const handleConsultar = useCallback(
    (item: SolicitudItem) => {
      setSolicitudSeleccionada(item);
      setVista("progreso");
      onConsultarEstatus?.(item);
    },
    [onConsultarEstatus]
  );

  const handleVerExpediente = useCallback(
    (item: SolicitudItem) => {
      setSolicitudSeleccionada(item);
      setVista("expediente");
      onVerExpediente?.(item);
    },
    [onVerExpediente]
  );

  const handleVolver = useCallback(() => {
    setVista("tabla");
    setSolicitudSeleccionada(null);
  }, []);

  return {
    solicitudes,
    isLoading,
    error,
    vista,
    solicitudSeleccionada,
    handleConsultar,
    handleVerExpediente,
    handleVolver,
    recargar: cargarSolicitudes,
  };
}
