"use client";

import React, { useState, useMemo } from "react";
import { SolicitudFirmaItem } from "./types";
import { MOCK_SOLICITUDES_FIRMA } from "./mockData";
import { AzureTableHeader } from "./AzureTableHeader";
import { AzureTableRow } from "./AzureTableRow";
import "@/design-tokens/azure/azure-table.css";

interface AzureTableProps {
  initialSolicitudes?: SolicitudFirmaItem[];
  onEvaluar?: (item: SolicitudFirmaItem) => void;
  className?: string;
}

export function AzureTable({
  initialSolicitudes = MOCK_SOLICITUDES_FIRMA,
  onEvaluar,
  className = "",
}: AzureTableProps) {
  const [solicitudes, setSolicitudes] = useState<SolicitudFirmaItem[]>(initialSolicitudes);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSolicitudes = useMemo(() => {
    if (!searchTerm.trim()) return solicitudes;
    const term = searchTerm.toLowerCase();
    return solicitudes.filter(
      (sol) =>
        sol.id.toLowerCase().includes(term) ||
        sol.fechaSolicitud.toLowerCase().includes(term) ||
        sol.fechaEvaluacion.toLowerCase().includes(term) ||
        sol.etapaActual.toLowerCase().includes(term)
    );
  }, [solicitudes, searchTerm]);

  const handleEvaluarClick = (item: SolicitudFirmaItem) => {
    if (onEvaluar) {
      onEvaluar(item);
    } else {
      // Mock firma local
      setSolicitudes((prev) =>
        prev.map((sol) =>
          sol === item
            ? {
                ...sol,
                etapaActual: "Evaluado",
                evaluar: { firmado: true, fechaFirma: new Date().toLocaleDateString("en-US") },
              }
            : sol
        )
      );
    }
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
        {filteredSolicitudes.length > 0 ? (
          filteredSolicitudes.map((item, idx) => (
            <AzureTableRow
              key={`${item.id}-${idx}`}
              item={item}
              onEvaluar={handleEvaluarClick}
            />
          ))
        ) : (
          <div className="w-full py-12 text-center text-gray-500 font-medium">
            No se encontraron expedientes para la búsqueda &quot;{searchTerm}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
