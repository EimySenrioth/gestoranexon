"use client";

import React from "react";

interface TableSolicitudHeaderProps {
  className?: string;
}

export function TableSolicitudHeader({ className = "" }: TableSolicitudHeaderProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Fila superior: Icono + Título + Separador + Texto informativo */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6 pb-4">
        {/* Icono del sobre con '?' */}
        <div className="flex-shrink-0">
          <svg
            width="44"
            height="44"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Sobre base */}
            <rect x="6" y="16" width="38" height="28" rx="5" fill="#EAB308" stroke="#000000" strokeWidth="2.5" />
            {/* Carta saliendo */}
            <rect x="12" y="8" width="26" height="20" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
            <line x1="17" y1="14" x2="27" y2="14" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="17" y1="18" x2="31" y2="18" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
            {/* Solapa del sobre */}
            <path
              d="M6 18L24 31C24.6 31.4 25.4 31.4 26 31L44 18"
              stroke="#000000"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Medalla circular con '?' */}
            <circle cx="39" cy="18" r="9" fill="#000000" stroke="#FFFFFF" strokeWidth="2" />
            <text
              x="39"
              y="23"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="12"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              ?
            </text>
          </svg>
        </div>

        {/* Título de la tabla */}
        <h2
          className="text-xl md:text-2xl font-bold text-black"
          style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
        >
          Tabla de solicitudes
        </h2>

        {/* Separador vertical */}
        <div className="hidden sm:block w-[1.5px] h-9 bg-black/60 self-center" />

        {/* Subtítulo / Instrucción */}
        <p
          className="text-sm md:text-base font-normal text-black max-w-md leading-snug"
          style={{ fontFamily: "var(--ui-font-family-lagu, sans-serif)" }}
        >
          Para ver el progreso de tu solicitud dar click en herramientas
        </p>
      </div>

      {/* Línea divisoria horizontal */}
      <div className="w-full h-[1.5px] bg-black/80 mb-6" />
    </div>
  );
}
