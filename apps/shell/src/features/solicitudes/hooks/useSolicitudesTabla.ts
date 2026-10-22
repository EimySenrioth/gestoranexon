"use client";

import { useState, useEffect, useCallback } from "react";
import { SolicitudItem } from "../types/tabla.types";
import { listarMisSolicitudes } from "../services/expedientes.service";

interface UseSolicitudesTablaOptions {
  initialSolicitudes?: SolicitudItem[];
  initialPage?: number;
  limit?: number;
  onConsultarEstatus?: (solicitud: SolicitudItem) => void;
  onVerExpediente?: (solicitud: SolicitudItem) => void;
}

export function useSolicitudesTabla({
  initialSolicitudes,
  initialPage = 1,
  limit = 10,
  onConsultarEstatus,
  onVerExpediente,
}: UseSolicitudesTablaOptions = {}) {
  const [solicitudes, setSolicitudes] = useState<SolicitudItem[]>(
    initialSolicitudes || []
  );
  const [page, setPage] = useState<number>(initialPage);
  const [total, setTotal] = useState<number>(initialSolicitudes?.length || 0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [vista, setVista] = useState<"tabla" | "progreso" | "expediente">("tabla");
  const [solicitudSeleccionada, setSolicitudSeleccionada] =
    useState<SolicitudItem | null>(null);
  const [isLoading, setIsLoading] = useState(!initialSolicitudes);
  const [error, setError] = useState<string | null>(null);

  const cargarSolicitudes = useCallback(async (paginaActual: number = page) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await listarMisSolicitudes({ page: paginaActual, limit });
      if (data && Array.isArray(data.items)) {
        setSolicitudes(data.items);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } else {
        setSolicitudes([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al cargar solicitudes";
      setError(msg);
      setSolicitudes([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    if (initialSolicitudes && initialSolicitudes.length > 0) return;
    cargarSolicitudes(page);
  }, [page, initialSolicitudes, cargarSolicitudes]);

  const cambiarPagina = useCallback((nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages) {
      setPage(nuevaPagina);
    }
  }, [totalPages]);

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
    total,
    page,
    limit,
    totalPages,
    cambiarPagina,
    isLoading,
    error,
    vista,
    solicitudSeleccionada,
    handleConsultar,
    handleVerExpediente,
    handleVolver,
    recargar: () => cargarSolicitudes(page),
  };
}
