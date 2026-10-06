"use client";

import React from "react";
import { SolicitudItem } from "../types";

interface InformacionExpedienteProps {
  solicitud: SolicitudItem;
  onVolver?: () => void;
  className?: string;
}

export function InformacionExpediente({
  solicitud,
  onVolver,
  className = "",
}: InformacionExpedienteProps) {
  return (
    <div
      className={`w-full ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      {/* Layout Principal: 2 Secciones (Píldoras a la Izquierda + Tarjeta de Expediente a la Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Píldoras indicadoras con fondo blanco */}
        <div className="lg:col-span-4 flex flex-col gap-2.5 items-start">
          {/* Píldora 1: Expediente con icono de sobre */}
          <div className="inline-flex items-center justify-between w-full max-w-[280px] px-3.5 py-1 rounded-full border border-black/80 bg-white shadow-xs">
            <span className="text-sm font-semibold text-black tracking-tight">
              Expediente
            </span>
            <div className="flex-shrink-0 ml-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="4" y="10" width="28" height="20" rx="4" fill="#EAB308" stroke="#000000" strokeWidth="2" />
                <rect x="8" y="4" width="20" height="14" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
                <path d="M4 11L18 20L32 11" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="28" cy="11" r="6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
                <path d="M26 11L27.5 12.5L30 10" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Píldora 2: Revisa el veredicto del comite de etica */}
          <div className="inline-flex items-center gap-2 w-full max-w-[280px] px-3.5 py-1 rounded-full border border-black/80 bg-white shadow-xs">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-white flex-shrink-0" />
            <span className="text-xs font-medium text-black leading-tight">
              Revisa el veredicto del comite de etica
            </span>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta Oficial de Expediente Finalizado (con fondo blanco) */}
        <div className="lg:col-span-8 w-full">
          <div className="w-full rounded-3xl border-2 border-black/80 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between">
            {/* 1. Cabecera con Hora de Recepción */}
            <div>
              <div className="text-xs md:text-sm font-medium text-gray-700 mb-2 pl-1">
                Recibido · 10:35 a.m.
              </div>

              {/* Separador Horizontal */}
              <div className="w-full h-px bg-black/80 mb-6" />

              {/* 2. Título de Expediente y Fecha */}
              <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-2 mb-6">
                <h3 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                  Expediente Finalizado
                </h3>
                <div className="flex flex-col text-left sm:text-right">
                  <span className="text-xs md:text-sm font-semibold text-gray-700">
                    Fecha y hora de envío
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-black mt-0.5">
                    {solicitud.fecha || "9/26/2026"}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Píldora Central de Estado Aprobado (borde reducido otros 2pt a rounded-xl) */}
            <div className="w-full py-1.5 px-6 rounded-xl bg-gray-200/90 border border-gray-300 text-center text-sm md:text-base font-bold text-black shadow-xs my-4">
              Aprobado con observaciones
            </div>

            {/* 4. Botones de Acción Píldora en una sola hilera */}
            <div className="flex items-center justify-between gap-2 my-6 overflow-x-auto">
              <button
                type="button"
                className="flex-1 whitespace-nowrap px-2.5 py-1.5 rounded-full border border-black/80 bg-white hover:bg-black hover:text-white text-[11px] sm:text-xs font-semibold text-black transition-colors cursor-pointer shadow-xs text-center"
              >
                Descargar Anexo N°9 (PDF)
              </button>
              <button
                type="button"
                className="flex-1 whitespace-nowrap px-2.5 py-1.5 rounded-full border border-black/80 bg-white hover:bg-black hover:text-white text-[11px] sm:text-xs font-semibold text-black transition-colors cursor-pointer shadow-xs text-center"
              >
                Ver historial de estatus
              </button>
              <button
                type="button"
                className="flex-1 whitespace-nowrap px-2.5 py-1.5 rounded-full border border-black/80 bg-white hover:bg-black hover:text-white text-[11px] sm:text-xs font-semibold text-black transition-colors cursor-pointer shadow-xs text-center"
              >
                Confirmación de recepción
              </button>
            </div>

            {/* 5. Pie de página institucional con correo */}
            <div className="text-center text-xs md:text-sm font-medium text-gray-700 pt-2">
              También enviado a tu correo institucional · vrios@untels.edu.pe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
