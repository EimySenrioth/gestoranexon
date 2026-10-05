"use client";

import React, { useState } from "react";
import { SolicitudItem, MOCK_SOLICITUDES, ProgresoEstado } from "./types";
import { TableSolicitudHeader } from "./TableSolicitudHeader";
import { TableSolicitudRow } from "./TableSolicitudRow";

interface TableSolicitudProps {
  initialSolicitudes?: SolicitudItem[];
  onConsultarEstatus?: (solicitud: SolicitudItem) => void;
  className?: string;
}

export function TableSolicitud({
  initialSolicitudes = MOCK_SOLICITUDES,
  onConsultarEstatus,
  className = "",
}: TableSolicitudProps) {
  const [solicitudes] = useState<SolicitudItem[]>(initialSolicitudes);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudItem | null>(null);

  const handleConsultar = (item: SolicitudItem) => {
    setSelectedSolicitud(item);
    onConsultarEstatus?.(item);
  };

  return (
    <div
      className={`w-full max-w-5xl mx-auto bg-white rounded-3xl border-2 border-black/80 shadow-2xl p-6 md:p-8 transition-all ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      {/* 1. Encabezado institucional */}
      <TableSolicitudHeader />

      {/* 2. Cabecera de columnas de la tabla */}
      <div className="hidden md:grid grid-cols-5 items-center gap-3 px-5 mb-3 text-center">
        <span className="text-left font-bold text-black text-base md:text-lg">
          ID
        </span>
        <span className="font-bold text-black text-base md:text-lg">
          Fecha
        </span>
        <span className="font-bold text-black text-base md:text-lg">
          Finalizado
        </span>
        <span className="font-bold text-black text-base md:text-lg">
          Evaluación
        </span>
        <span className="font-bold text-black text-base md:text-lg">
          Progreso
        </span>
      </div>

      {/* 3. Listado de filas de solicitudes */}
      <div className="flex flex-col gap-3.5">
        {solicitudes.length > 0 ? (
          solicitudes.map((sol, index) => (
            <TableSolicitudRow
              key={`${sol.id}-${index}`}
              solicitud={sol}
              onConsultar={handleConsultar}
            />
          ))
        ) : (
          <div className="w-full py-12 text-center text-gray-500 font-medium">
            No hay solicitudes registradas actualmente.
          </div>
        )}
      </div>

      {/* 4. Panel informativo de estatus al consultar una solicitud */}
      {selectedSolicitud && (
        <div className="mt-6 p-4 rounded-2xl border-2 border-black bg-gray-50 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm md:text-base font-bold text-black">
              {selectedSolicitud.id} — Fecha: {selectedSolicitud.fecha}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-semibold text-gray-600">
              Estado de Progreso:
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs md:text-sm font-bold bg-black text-white uppercase tracking-wider">
              {selectedSolicitud.progreso}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
