"use client";

import React from "react";
import { SolicitudItem } from "../types";

interface InformacionSolicitudProgresoProps {
  solicitud: SolicitudItem;
  onVolver?: () => void;
  className?: string;
}

interface HitoEvaluacion {
  titulo: string;
  fecha: string;
  estado: "Aprobado" | "Pendiente" | "Observado";
}

export function InformacionSolicitudProgreso({
  solicitud,
  onVolver,
  className = "",
}: InformacionSolicitudProgresoProps) {
  // Lista de 6 hitos oficiales de evaluación según la maqueta
  const hitos: HitoEvaluacion[] = [
    {
      titulo: "2.1 Cumplimiento de Principios Éticos",
      fecha: solicitud.fecha || "9/26/2026",
      estado: "Aprobado",
    },
    {
      titulo: "2.2 Metodología y Riesgos",
      fecha: solicitud.fecha || "9/26/2026",
      estado: "Aprobado",
    },
    {
      titulo: "2.3 Cumplimiento de Normativa Legal",
      fecha: solicitud.fecha || "9/26/2026",
      estado: "Aprobado",
    },
    {
      titulo: "Recomendaciones de Comité",
      fecha: solicitud.fecha || "9/26/2026",
      estado: "Aprobado",
    },
    {
      titulo: "Firmas del Comité de Ética",
      fecha: solicitud.fecha || "9/26/2026",
      estado: "Aprobado",
    },
    {
      titulo: "Envío del expediente solicitante",
      fecha: solicitud.fecha || "9/26/2026",
      estado: "Pendiente",
    },
  ];

  return (
    <div
      className={`w-full ${className}`}
      style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
    >
      {/* Botón Volver a la tabla */}
      <button
        type="button"
        onClick={onVolver}
        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-black transition-colors cursor-pointer select-none"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Volver a la tabla de solicitudes</span>
      </button>

      {/* Título Principal Centrado */}
      <h2 className="text-2xl md:text-3xl font-bold text-black text-center mb-8">
        Información de la solicitud
      </h2>

      {/* Grid de 2 Columnas: Panel de Estado a la Izquierda + Hitos a la Derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Tarjeta de Resumen y Contador de Etapas */}
        <div className="lg:col-span-4 flex justify-center lg:justify-start">
          <div className="w-full max-w-[320px] rounded-2xl border-2 border-black/80 bg-white p-4 shadow-sm flex items-stretch">
            {/* Lado izquierdo: Iconos (Sobre con ? + Círculo de progreso azul) */}
            <div className="flex flex-col items-center justify-between pr-4 border-r-2 border-black/70 gap-6">
              {/* Icono del sobre con '?' */}
              <div className="flex-shrink-0">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="6" y="16" width="38" height="28" rx="5" fill="#EAB308" stroke="#000000" strokeWidth="2.5" />
                  <rect x="12" y="8" width="26" height="20" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
                  <line x1="17" y1="14" x2="27" y2="14" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="17" y1="18" x2="31" y2="18" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M6 18L24 31C24.6 31.4 25.4 31.4 26 31L44 18" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="39" cy="18" r="9" fill="#000000" stroke="#FFFFFF" strokeWidth="2" />
                  <text x="39" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">?</text>
                </svg>
              </div>

              {/* Icono circular de progreso con anillo azul */}
              <div className="flex-shrink-0">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="18" cy="18" r="14" stroke="#CBD5E1" strokeWidth="3" />
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    stroke="#38BDF8"
                    strokeWidth="3.5"
                    strokeDasharray="80"
                    strokeDashoffset="15"
                    strokeLinecap="round"
                  />
                  <path d="M12 18L16 22L24 14" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Lado derecho: Números de etapas + Solicitud ID + Ratio 6/6 */}
            <div className="flex-1 flex flex-col justify-between pl-4">
              {/* Números de etapas con 06 destacado en azul */}
              <div className="flex items-center justify-between text-xs md:text-sm font-mono tracking-wider text-gray-400">
                <span>01</span>
                <span>02</span>
                <span>03</span>
                <span>04</span>
                <span>05</span>
                <span className="font-bold text-sky-500">06</span>
              </div>

              <div className="my-2 h-px bg-gray-200" />

              {/* Solicitud ID y ratio 6/6 */}
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-xs md:text-sm font-medium text-black">
                    Solicitud ID
                  </span>
                  <div className="w-20 h-3 bg-gray-300 rounded-sm mt-1" />
                </div>
                <span className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                  6/6
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjetas de los 6 Hitos de Evaluación */}
        <div className="lg:col-span-8 flex flex-col gap-3.5 w-full">
          {hitos.map((hito, index) => {
            const isAprobado = hito.estado === "Aprobado";
            return (
              <div
                key={index}
                className="w-full rounded-2xl border-2 border-black/80 bg-white p-2.5 md:p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:shadow-md transition-shadow"
              >
                {/* 1. Descripción de la etapa */}
                <div className="flex-1 pl-2 text-sm md:text-base font-semibold text-black">
                  {hito.titulo}
                </div>

                {/* 2. Fecha con fondo gris claro */}
                <div className="flex-shrink-0 flex items-center justify-center bg-gray-200/90 border border-gray-300 rounded-xl px-4 py-1.5 text-xs md:text-sm font-medium text-black">
                  {hito.fecha}
                </div>

                {/* 3. Cápsula de Estado (Aprobado / Pendiente) */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  <span
                    className={`min-w-[120px] text-center px-5 py-1.5 rounded-xl border-2 border-black/80 font-bold text-xs md:text-sm shadow-xs ${
                      isAprobado
                        ? "bg-white text-black"
                        : "bg-white text-gray-500 border-gray-400"
                    }`}
                  >
                    {hito.estado}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
