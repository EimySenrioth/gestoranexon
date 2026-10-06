"use client";

import React, { useState } from "react";
import { SolicitudItem, MOCK_SOLICITUDES } from "./types";
import { TableSolicitudHeader } from "./TableSolicitudHeader";
import { TableSolicitudRow } from "./TableSolicitudRow";
import { InformacionSolicitudProgreso } from "./informacion-solicitud-progreso/InformacionSolicitudProgreso";
import { InformacionExpediente } from "./expediente/InformacionExpediente";

interface TableSolicitudProps {
  initialSolicitudes?: SolicitudItem[];
  onConsultarEstatus?: (solicitud: SolicitudItem) => void;
  onVerExpediente?: (solicitud: SolicitudItem) => void;
  className?: string;
}

export function TableSolicitud({
  initialSolicitudes = MOCK_SOLICITUDES,
  onConsultarEstatus,
  onVerExpediente,
  className = "",
}: TableSolicitudProps) {
  const [solicitudes] = useState<SolicitudItem[]>(initialSolicitudes);
  const [vista, setVista] = useState<"tabla" | "progreso" | "expediente">("tabla");
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudItem | null>(null);

  const handleConsultar = (item: SolicitudItem) => {
    setSolicitudSeleccionada(item);
    setVista("progreso");
    onConsultarEstatus?.(item);
  };

  const handleVerExpediente = (item: SolicitudItem) => {
    setSolicitudSeleccionada(item);
    setVista("expediente");
    onVerExpediente?.(item);
  };

  const handleVolver = () => {
    setVista("tabla");
    setSolicitudSeleccionada(null);
  };

  return (
    <div
      className={`w-full max-w-5xl mx-auto transition-all ${
        vista === "expediente"
          ? "p-0"
          : "bg-white rounded-3xl border-2 border-black/80 shadow-2xl p-6 md:p-8"
      } ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      {vista === "progreso" && solicitudSeleccionada ? (
        <InformacionSolicitudProgreso
          solicitud={solicitudSeleccionada}
          onVolver={handleVolver}
        />
      ) : vista === "expediente" && solicitudSeleccionada ? (
        <InformacionExpediente
          solicitud={solicitudSeleccionada}
          onVolver={handleVolver}
        />
      ) : (
        <>
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
                  onVerExpediente={handleVerExpediente}
                />
              ))
            ) : (
              <div className="w-full py-12 text-center text-gray-500 font-medium">
                No hay solicitudes registradas actualmente.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
