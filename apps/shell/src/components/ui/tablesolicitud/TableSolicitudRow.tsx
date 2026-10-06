"use client";

import React from "react";
import { SolicitudItem } from "./types";

interface TableSolicitudRowProps {
  solicitud: SolicitudItem;
  onConsultar?: (solicitud: SolicitudItem) => void;
  onVerExpediente?: (solicitud: SolicitudItem) => void;
  className?: string;
}

export function TableSolicitudRow({
  solicitud,
  onConsultar,
  onVerExpediente,
  className = "",
}: TableSolicitudRowProps) {
  const isFinalizado = solicitud.finalizado === "Si";

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

        {/* 5. Progreso ('Consultar estatus' o 'Expediente') */}
        <div className="flex justify-end md:justify-center col-span-2 sm:col-span-1 md:col-span-1">
          {isFinalizado ? (
            <button
              type="button"
              onClick={() => onVerExpediente?.(solicitud)}
              title="Ver expediente finalizado"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-1.5 rounded-full border-2 border-black/90 bg-white text-black hover:bg-black hover:text-white text-xs md:text-sm font-bold transition-all shadow-xs select-none active:scale-95 cursor-pointer"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            >
              <span>Expediente</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="22,6 12,13 2,6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onConsultar?.(solicitud)}
              title="Consultar progreso de la solicitud"
              className="px-5 py-1.5 rounded-full border-2 border-black/90 bg-white text-black hover:bg-black hover:text-white text-xs md:text-sm font-bold transition-all shadow-xs select-none active:scale-95 cursor-pointer"
              style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
            >
              Consultar estatus
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
