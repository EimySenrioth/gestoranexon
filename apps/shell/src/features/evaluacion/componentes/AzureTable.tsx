"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SolicitudFirmaItem } from "../types/evaluacion.types";
import { AzureTableHeader } from "./AzureTableHeader";
import { AzureTableRow } from "./AzureTableRow";
import { AzureTablePaginacion } from "./AzureTablePaginacion";
import { ModalEvaluacion } from "../modales/ModalEvaluacion";
import { useEvaluacion } from "../hooks/useEvaluacion";
import "@/design-tokens/azure/azure-table.css";

interface AzureTableProps {
  initialSolicitudes?: SolicitudFirmaItem[];
  initialPage?: number;
  limit?: number;
  onEvaluar?: (item: SolicitudFirmaItem) => void;
  className?: string;
}

export function AzureTable({
  initialSolicitudes,
  initialPage = 1,
  limit = 10,
  onEvaluar,
  className = "",
}: AzureTableProps) {
  const router = useRouter();

  const {
    solicitudes,
    page,
    totalPages,
    total,
    cambiarPagina,
    searchTerm,
    setSearchTerm,
    solicitudAEvaluar,
    isModalOpen,
    isLoading,
    handleEvaluarClick,
    handleCloseModal,
    handleConfirmarEvaluacion: confirmarEvaluacionHook,
  } = useEvaluacion({
    initialSolicitudes,
    initialPage,
    limit,
    onEvaluarSuccess: (item) => {
      onEvaluar?.(item);
      router.push("/homeview2/evaluacion");
    },
  });

  const handleConfirmarEvaluacion = (item?: SolicitudFirmaItem) => {
    confirmarEvaluacionHook(item);
  };

  const handleEtapaClick = (item: SolicitudFirmaItem) => {
    router.push(`/homeview2/statusexpediente?id=${encodeURIComponent(item.id)}`);
  };

  return (
    <div className={`azure-table-card ${className}`}>
      {/* 1. Encabezado con título e input buscador de expedientes */}
      <AzureTableHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* 2. Cabecera de columnas de la tabla estilo Azure */}
      <div className="azure-table-head" role="row">
        <span>ID</span>
        <span>Fecha Solicitud</span>
        <span>Fecha de Evaluacion</span>
        <span>Etapa Actual</span>
        <span>Evaluar</span>
      </div>

      {/* 3. Filas de solicitudes */}
      <div className="azure-table-body">
        {isLoading ? (
          <div className="w-full py-12 text-center text-gray-400 font-medium animate-pulse">
            Cargando solicitudes para evaluación...
          </div>
        ) : solicitudes.length > 0 ? (
          solicitudes.map((item, idx) => (
            <AzureTableRow
              key={`${item.id}-${idx}`}
              item={item}
              onEvaluar={handleEvaluarClick}
              onEtapaClick={handleEtapaClick}
            />
          ))
        ) : (
          <div className="w-full py-12 text-center text-gray-500 font-medium">
            {searchTerm.trim()
              ? `No se encontraron expedientes para la búsqueda "${searchTerm}".`
              : "No tienes expedientes asignados para evaluación en este momento."}
          </div>
        )}
      </div>

      {/* 4. Paginación con estilo de la vista de solicitante (10 expedientes por página) */}
      <AzureTablePaginacion
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={cambiarPagina}
        disabled={isLoading}
      />

      {/* 5. Modal de confirmación y advertencia normativa antes de iniciar evaluación */}
      <ModalEvaluacion
        isOpen={isModalOpen}
        item={solicitudAEvaluar}
        onClose={handleCloseModal}
        onConfirm={handleConfirmarEvaluacion}
      />
    </div>
  );
}
