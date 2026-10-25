import React from "react";

interface IconDecisionPresidenteProps {
  className?: string;
  size?: number;
}

/**
 * IconDecisionPresidente — Ícono circular verde esmeralda con sello y checkmark institucional.
 * Diseñado en armonía con IconDocumentoA para la acción de Presidencia CEI.
 */
export function IconDecisionPresidente({
  className = "",
  size = 48,
}: IconDecisionPresidenteProps) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-[#A3E3CE] border-2 border-[#16503E] shadow-sm flex-shrink-0 ${className}`}
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
        {/* Silueta de hoja oficial */}
        <path
          d="M4 2C2.89543 2 2 2.89543 2 4V32C2 33.1046 2.89543 34 4 34H26C27.1046 34 28 33.1046 28 32V10L20 2H4Z"
          fill="#FFFFFF"
          stroke="#16503E"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Doble esquina superior */}
        <path
          d="M20 2V10H28"
          fill="#D1EFE5"
          stroke="#16503E"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Sello circular con checkmark de aprobación */}
        <circle cx="15" cy="18" r="7" fill="#E8F8F3" stroke="#16503E" strokeWidth="1.8" />
        <polyline
          points="11.5 18 14 20.5 18.5 15.5"
          fill="none"
          stroke="#107C10"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Línea inferior de firma de Presidencia */}
        <line
          x1="6"
          y1="28"
          x2="24"
          y2="28"
          stroke="#16503E"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
