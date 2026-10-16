"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { SolicitudFirmaItem } from "../types/evaluacion.types";
import { AzureTableHeader } from "./AzureTableHeader";
import { AzureTableRow } from "./AzureTableRow";
import { ModalEvaluacion } from "../modales/ModalEvaluacion";
import { useEvaluacion } from "../hooks/useEvaluacion";
import "@/design-tokens/azure/azure-table.css";

interface AzureTableProps {
  initialSolicitudes?: SolicitudFirmaItem[];
  onEvaluar?: (item: SolicitudFirmaItem) => void;
  className?: string;
}

export function AzureTable({
  initialSolicitudes,
  onEvaluar,
  className = "",
}: AzureTableProps) {
  const router = useRouter();

  const {
    solicitudes,
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
            No se encontraron expedientes para la búsqueda &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>

      {/* 4. Modal de confirmación y advertencia normativa antes de iniciar evaluación */}
      <ModalEvaluacion
        isOpen={isModalOpen}
        item={solicitudAEvaluar}
        onClose={handleCloseModal}
        onConfirm={handleConfirmarEvaluacion}
      />
    </div>
  );
}
