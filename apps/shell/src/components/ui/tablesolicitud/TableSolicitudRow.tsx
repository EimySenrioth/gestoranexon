"use client";

import React from "react";
import { SolicitudItem } from "./types";

interface TableSolicitudRowProps {
  solicitud: SolicitudItem;
  onConsultar?: (solicitud: SolicitudItem) => void;
  className?: string;
}

export function TableSolicitudRow({
  solicitud,
  onConsultar,
  className = "",
}: TableSolicitudRowProps) {
  return (
    <div
      className={`w-full rounded-2xl border-2 border-black/80 bg-white px-5 py-3 shadow-sm transition-all hover:shadow-md ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 items-center gap-3">
        {/* 1. ID */}
        <div className="text-left font-medium text-black text-sm md:text-base">
          {solicitud.id}
        </div>

        {/* 2. Fecha */}
        <div className="text-center font-normal text-black text-sm md:text-base">
          {solicitud.fecha}
        </div>

        {/* 3. Finalizado */}
        <div className="text-center font-medium text-black text-sm md:text-base">
          {solicitud.finalizado}
        </div>

        {/* 4. Evaluación (Cápsula redondeada con borde) */}
        <div className="flex justify-center">
          <span className="inline-flex items-center justify-center min-w-[130px] px-4 py-1 rounded-full border border-black/80 bg-white text-black text-xs md:text-sm font-semibold tracking-wide shadow-xs">
            {solicitud.evaluacion}
          </span>
        </div>

        {/* 5. Progreso (Botón 'Consultar estatus') */}
        <div className="flex justify-end md:justify-center col-span-2 sm:col-span-1 md:col-span-1">
          <button
            type="button"
            onClick={() => onConsultar?.(solicitud)}
            className="px-5 py-1.5 rounded-full border-2 border-black/90 bg-white text-black text-xs md:text-sm font-bold transition-all hover:bg-black hover:text-white active:scale-95 cursor-pointer shadow-xs select-none"
            style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
          >
            Consultar estatus
          </button>
        </div>
      </div>
    </div>
  );
}
