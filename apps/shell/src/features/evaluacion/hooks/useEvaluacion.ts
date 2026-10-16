"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SolicitudFirmaItem } from "../types/evaluacion.types";
import {
  listarSolicitudesParaEvaluar,
  firmarSolicitudEvaluacion,
} from "../services/evaluacion.service";
import { useDebounce } from "@/hooks/useDebounce";

interface UseEvaluacionOptions {
  initialSolicitudes?: SolicitudFirmaItem[];
  onEvaluarSuccess?: (item: SolicitudFirmaItem) => void;
}

export function useEvaluacion({
  initialSolicitudes,
  onEvaluarSuccess,
}: UseEvaluacionOptions = {}) {
  const [solicitudes, setSolicitudes] = useState<SolicitudFirmaItem[]>(
    initialSolicitudes || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  const [solicitudAEvaluar, setSolicitudAEvaluar] =
    useState<SolicitudFirmaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialSolicitudes);
  const [isFirmando, setIsFirmando] = useState(false);

  // Cargar solicitudes iniciales si no se pasaron por props
  useEffect(() => {
    if (initialSolicitudes && initialSolicitudes.length > 0) return;

    let isMounted = true;
    setIsLoading(true);

    listarSolicitudesParaEvaluar()
      .then((data) => {
        if (isMounted) setSolicitudes(data);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialSolicitudes]);

  // Filtrado reactivo mediante useDebounce
  const filteredSolicitudes = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return solicitudes;
    const term = debouncedSearchTerm.toLowerCase();
    return solicitudes.filter(
      (sol) =>
        sol.id.toLowerCase().includes(term) ||
        sol.fechaSolicitud.toLowerCase().includes(term) ||
        sol.fechaEvaluacion.toLowerCase().includes(term) ||
        sol.etapaActual.toLowerCase().includes(term)
    );
  }, [solicitudes, debouncedSearchTerm]);

  const handleEvaluarClick = useCallback((item: SolicitudFirmaItem) => {
    setSolicitudAEvaluar(item);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSolicitudAEvaluar(null);
  }, []);

  const handleConfirmarEvaluacion = useCallback(
    async (item?: SolicitudFirmaItem) => {
      const target = item || solicitudAEvaluar;
      if (!target) return;

      setIsFirmando(true);
      try {
        await firmarSolicitudEvaluacion(target.id);

        const updatedItem: SolicitudFirmaItem = {
          ...target,
          etapaActual: "Evaluado",
          evaluar: { firmado: true, fechaFirma: new Date().toLocaleDateString() },
        };

        setSolicitudes((prev) =>
          prev.map((s) => (s.id === target.id ? updatedItem : s))
        );

        onEvaluarSuccess?.(updatedItem);
      } finally {
        setIsFirmando(false);
        setIsModalOpen(false);
        setSolicitudAEvaluar(null);
      }
    },
    [solicitudAEvaluar, onEvaluarSuccess]
  );

  return {
    solicitudes: filteredSolicitudes,
    totalCount: solicitudes.length,
    searchTerm,
    setSearchTerm,
    solicitudAEvaluar,
    isModalOpen,
    isLoading,
    isFirmando,
    handleEvaluarClick,
    handleCloseModal,
    handleConfirmarEvaluacion,
  };
}
