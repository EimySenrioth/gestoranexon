"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { SolicitudFirmaItem } from "../types/evaluacion.types";
import {
  listarSolicitudesParaEvaluar,
  iniciarSesionEvaluacion,
} from "../services/evaluacion.service";
import { useDebounce } from "@/hooks/useDebounce";

interface UseEvaluacionOptions {
  initialSolicitudes?: SolicitudFirmaItem[];
  initialPage?: number;
  limit?: number;
  onEvaluarSuccess?: (item: SolicitudFirmaItem, token?: string) => void;
}

export function useEvaluacion({
  initialSolicitudes,
  initialPage = 1,
  limit = 10,
  onEvaluarSuccess,
}: UseEvaluacionOptions = {}) {
  const [solicitudes, setSolicitudes] = useState<SolicitudFirmaItem[]>(
    initialSolicitudes || []
  );
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(initialSolicitudes?.length || 0);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 250);

  const [solicitudAEvaluar, setSolicitudAEvaluar] =
    useState<SolicitudFirmaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [solicitudAAprobar, setSolicitudAAprobar] =
    useState<SolicitudFirmaItem | null>(null);
  const [isModalAprobarOpen, setIsModalAprobarOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(!initialSolicitudes);
  const [isFirmando, setIsFirmando] = useState(false);

  // Carga de datos reales paginados desde el backend
  const cargarSolicitudes = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const res = await listarSolicitudesParaEvaluar({
          page: targetPage,
          limit,
        });
        setSolicitudes(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    if (initialSolicitudes && initialSolicitudes.length > 0) return;
    cargarSolicitudes(page);
  }, [cargarSolicitudes, initialSolicitudes, page]);

  // Cambiar página
  const cambiarPagina = useCallback(
    (nuevaPagina: number) => {
      if (nuevaPagina >= 1 && (nuevaPagina <= totalPages || totalPages === 0)) {
        setPage(nuevaPagina);
      }
    },
    [totalPages]
  );

  // Filtrado reactivo en cliente sobre la página actual mediante searchTerm
  const filteredSolicitudes = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return solicitudes;
    const term = debouncedSearchTerm.toLowerCase();
    return solicitudes.filter(
      (sol) =>
        sol.id.toLowerCase().includes(term) ||
        sol.fechaSolicitud.toLowerCase().includes(term) ||
        sol.fechaEvaluacion.toLowerCase().includes(term) ||
        sol.etapaActual.toLowerCase().includes(term) ||
        (sol.titulo && sol.titulo.toLowerCase().includes(term))
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
      if (!target) {
        setIsModalOpen(false);
        return;
      }

      setIsFirmando(true);
      let token: string | undefined;
      try {
        // Solicitar token contextual de evaluación al backend
        const sesion = await iniciarSesionEvaluacion(target.id);
        token = sesion?.token;
      } catch (error) {
        console.warn("[useEvaluacion] Aviso al obtener token del backend, navegando de forma resiliente:", error);
      } finally {
        setIsFirmando(false);
        setIsModalOpen(false);
        setSolicitudAEvaluar(null);
        onEvaluarSuccess?.(target, token);
      }
    },
    [onEvaluarSuccess, solicitudAEvaluar]
  );

  const handleAprobarClick = useCallback((item: SolicitudFirmaItem) => {
    setSolicitudAAprobar(item);
    setIsModalAprobarOpen(true);
  }, []);

  const handleCloseModalAprobar = useCallback(() => {
    setIsModalAprobarOpen(false);
    setSolicitudAAprobar(null);
  }, []);

  const handleConfirmarAprobacion = useCallback(
    (item?: SolicitudFirmaItem) => {
      const target = item || solicitudAAprobar;
      if (!target) return;

      const fechaHoy = new Date().toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      const updatedItem: SolicitudFirmaItem = {
        ...target,
        etapaActual: "Dictaminado",
        aprobar: { aprobado: true, fechaAprobacion: fechaHoy },
      };

      setSolicitudes((prev) =>
        prev.map((s) => (s.id === target.id ? updatedItem : s))
      );

      setIsModalAprobarOpen(false);
      setSolicitudAAprobar(null);
    },
    [solicitudAAprobar]
  );

  const handleConfirmarRechazo = useCallback(
    (item?: SolicitudFirmaItem) => {
      const target = item || solicitudAAprobar;
      if (!target) return;

      const updatedItem: SolicitudFirmaItem = {
        ...target,
        etapaActual: "Observado",
        aprobar: { aprobado: false },
      };

      setSolicitudes((prev) =>
        prev.map((s) => (s.id === target.id ? updatedItem : s))
      );

      setIsModalAprobarOpen(false);
      setSolicitudAAprobar(null);
    },
    [solicitudAAprobar]
  );

  return {
    solicitudes: filteredSolicitudes,
    rawSolicitudes: solicitudes,
    page,
    totalPages,
    total,
    limit,
    cambiarPagina,
    searchTerm,
    setSearchTerm,
    solicitudAEvaluar,
    isModalOpen,
    solicitudAAprobar,
    isModalAprobarOpen,
    isLoading,
    isFirmando,
    handleEvaluarClick,
    handleCloseModal,
    handleConfirmarEvaluacion,
    handleAprobarClick,
    handleCloseModalAprobar,
    handleConfirmarAprobacion,
    handleConfirmarRechazo,
    recargar: () => cargarSolicitudes(page),
  };
}
