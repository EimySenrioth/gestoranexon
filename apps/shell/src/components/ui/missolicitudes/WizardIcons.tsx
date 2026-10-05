import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * 1. IconoSobreProyecto (Paso 1: Datos Generales)
 * Estilo B&N alto contraste con sobre, carta interior y medalla circular con interrogación.
 */
export function IconSobreProyecto({ size = 44, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Fondo circular o marco sutil */}
      <rect x="6" y="16" width="38" height="28" rx="5" fill="#1C1C1E" stroke="#000000" strokeWidth="2.5" />
      {/* Hoja de carta que sale del sobre */}
      <rect x="12" y="8" width="26" height="20" rx="3" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
      {/* Renglones en la carta */}
      <line x1="17" y1="14" x2="27" y2="14" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17" y1="18" x2="31" y2="18" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
      {/* Solapa del sobre */}
      <path
        d="M6 18L24 31C24.6 31.4 25.4 31.4 26 31L44 18"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Medalla circular de interrogación '?' en B&N */}
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
  );
}

/**
 * 2. IconoExpediente (Paso 2: Expediente)
 * Portapapeles con clip y medalla de checkmark en blanco y negro.
 */
export function IconExpediente({ size = 44, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Tablilla base */}
      <rect x="10" y="10" width="32" height="38" rx="5" fill="#1C1C1E" stroke="#000000" strokeWidth="2.5" />
      {/* Clip superior */}
      <rect x="19" y="6" width="14" height="7" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
      {/* Papel interior */}
      <rect x="14" y="15" width="24" height="28" rx="2" fill="#FFFFFF" />
      {/* Líneas de expediente */}
      <line x1="18" y1="21" x2="32" y2="21" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="26" x2="30" y2="26" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="31" x2="28" y2="31" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
      {/* Medalla con Checkmark */}
      <circle cx="38" cy="38" r="9" fill="#000000" stroke="#FFFFFF" strokeWidth="2" />
      <path
        d="M34.5 38L37 40.5L42 35.5"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 3. IconoRevisar (Paso 3: Revisar)
 * Documento de revisión y auditoría con checkmark en alto contraste B&N.
 */
export function IconRevisar({ size = 44, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Tablilla base */}
      <rect x="10" y="10" width="32" height="38" rx="5" fill="#1C1C1E" stroke="#000000" strokeWidth="2.5" />
      {/* Clip superior */}
      <rect x="19" y="6" width="14" height="7" rx="2" fill="#FFFFFF" stroke="#000000" strokeWidth="2" />
      {/* Hoja interior */}
      <rect x="14" y="15" width="24" height="28" rx="2" fill="#FFFFFF" />
      {/* Checklist items */}
      <circle cx="18" cy="22" r="2" fill="#000000" />
      <line x1="23" y1="22" x2="32" y2="22" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="18" cy="28" r="2" fill="#000000" />
      <line x1="23" y1="28" x2="30" y2="28" stroke="#000000" strokeWidth="1.8" strokeLinecap="round" />
      {/* Medalla con Checkmark */}
      <circle cx="38" cy="38" r="9" fill="#000000" stroke="#FFFFFF" strokeWidth="2" />
      <path
        d="M34.5 38L37 40.5L42 35.5"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 4. IconoAvionEnvio (Paso 4: Envío)
 * Avión de papel dinámico estilo origami B&N con estela de trayectoria punteada.
 */
export function IconAvionEnvio({ size = 44, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Trayectoria punteada */}
      <path
        d="M6 46C12 46 16 44 20 40C22 38 23 35 24 32"
        stroke="#000000"
        strokeWidth="2.2"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      {/* Avión de papel en origami B&N */}
      <path
        d="M48 10L18 26L28 32L48 10Z"
        fill="#1C1C1E"
        stroke="#000000"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M48 10L33 44L28 32L48 10Z"
        fill="#FFFFFF"
        stroke="#000000"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M28 32L26 40L31 35"
        stroke="#000000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 5. IconoAgregarInvestigador (⊕)
 * Botón circular de añadir en blanco y negro.
 */
export function IconAgregarInvestigador({ size = 26, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" stroke="#000000" strokeWidth="2" fill="#FFFFFF" />
      <line x1="12" y1="7" x2="12" y2="17" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
      <line x1="7" y1="12" x2="17" y2="12" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 6. IconoCalendario
 * Icono de calendario minimalista en blanco y negro.
 */
export function IconCalendario({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <rect x="3" y="4" width="18" height="17" rx="3" stroke="#000000" strokeWidth="2" fill="#FFFFFF" />
      <line x1="3" y1="9" x2="21" y2="9" stroke="#000000" strokeWidth="2" />
      <line x1="8" y1="2" x2="8" y2="6" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="6" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
      {/* Cuadrícula de días */}
      <circle cx="7.5" cy="13" r="1.2" fill="#000000" />
      <circle cx="12" cy="13" r="1.2" fill="#000000" />
      <circle cx="16.5" cy="13" r="1.2" fill="#000000" />
      <circle cx="7.5" cy="17" r="1.2" fill="#000000" />
      <circle cx="12" cy="17" r="1.2" fill="#000000" />
      <circle cx="16.5" cy="17" r="1.2" fill="#000000" />
    </svg>
  );
}

/**
 * 7. IconoChevronDown
 * Flecha minimalista para dropdowns.
 */
export function IconChevronDown({ size = 18, className = "", ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
