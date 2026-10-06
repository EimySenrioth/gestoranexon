import React from "react";

interface IconDocumentoAProps {
  className?: string;
  size?: number;
}

/**
 * IconDocumentoA — Ícono circular verde menta con hoja y letra "A"
 * Fiel a la referencia visual de "Antes de iniciar la evaluación".
 */
export function IconDocumentoA({ className = "", size = 48 }: IconDocumentoAProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-[#83D6BC] border-2 border-[#1E4D3E] shadow-sm flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.65}
        height={size * 0.65}
        viewBox="0 0 32 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fondo de la hoja blanca con esquina doblada */}
        <path
          d="M4 2C2.89543 2 2 2.89543 2 4V32C2 33.1046 2.89543 34 4 34H26C27.1046 34 28 33.1046 28 32V10L20 2H4Z"
          fill="#FFFFFF"
          stroke="#1F362F"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Pliegue de la esquina superior derecha */}
        <path
          d="M20 2V10H28"
          fill="#D6EBE4"
          stroke="#1F362F"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Letra 'A' centrada */}
        <text
          x="12"
          y="17"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="10"
          fontWeight="900"
          fill="#1F362F"
          textAnchor="middle"
        >
          A
        </text>
        {/* Líneas horizontales de texto */}
        <line x1="6" y1="22" x2="22" y2="22" stroke="#1F362F" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="6" y1="26" x2="20" y2="26" stroke="#1F362F" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="6" y1="30" x2="14" y2="30" stroke="#1F362F" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1 2.5" />
      </svg>
    </div>
  );
}
