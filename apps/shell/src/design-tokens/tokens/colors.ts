// colors.ts — Roles SEMÁNTICOS. Fuente única de verdad.
// Convención: colors.{grupo}.{clave} → --ui-{grupo}-{clave} → Tailwind --color-{grupo}-{clave}
import { palette as p } from "./palette.ts";

export const colors = {
  background: {
    app: p.dark950, // Fondo base más oscuro
    panel: p.dark900, // Barra lateral izquierda
    card: p.dark850, // Tarjetas de misiones
    cardHover: p.dark700, // Panel de recompensas de fase
    slot: p.slate950, // Slots de items
    icon: p.dark880, // Botones circulares
    modal: p.white, // Ventana de anuncios
    panelLight: p.gray100, // Botones del menú de anuncios
    overlay: p.blackAlpha70, // Sombra detrás de los modales
    dropdownTop: p.gray150, // Inicio del degradado del dropdown
    dropdownBottom: p.gray300, // Fin del degradado del dropdown
    groupStart: p.plum700, // Inicio del degradado del grupo de misiones
  },
  text: {
    primary: p.white, // Texto principal sobre oscuro
    secondary: p.gray400, // Precios, subtítulos
    muted: p.gray600, // Deshabilitado
    inverse: p.black, // Texto sobre fondos claros o vibrantes
    inverseSecondary: p.dark650, // Secundario en noticias
    inverseMuted: p.gray500, // Fechas en paneles claros
  },
  accent: {
    primary: p.pink500, // Pestañas activas, selección
    primaryGlow: p.pink500Alpha40, // Resplandor de seleccionados
    primaryText: p.pink400, // Textos resaltados
    cta: p.yellow400, // Llamada a la acción principal
    title: p.yellow500, // Títulos destacados
    progress: p.cyan400, // Relleno de barras de progreso
    highlight: p.lime300, // Destacados especiales (noticias)
  },
  status: {
    notification: p.red500, // Puntos de alerta
    strike: p.coral400, // Precios tachados
    progressTrack: p.dark650, // Track vacío de progreso
  },
  button: {
    primaryBg: p.yellow400,
    primaryText: p.dark900,
    defaultBg: p.dark800,
    defaultText: p.white,
    disabledBg: p.gray250,
    disabledText: p.gray600,
  },
  border: {
    active: p.pink500, // Borde de selección
    dividerDark: p.dark750, // Separadores en oscuro
    dividerLight: p.gray200, // Bordes del modal claro
    focus: p.white, // Anillo de foco
    node: p.gray350, // Nodos laterales del dropdown
  },
} as const;

// Parámetros del vidrio: traen alfa, por eso NO van al @theme de Tailwind
// (bg-x/50 no funcionaría). Solo generan --ui-glass-* en :root.
export const glass = {
  glass: {
    bg: "rgba(8, 8, 12, 0.55)",
    blur: "10px",
    edge: "rgba(255, 255, 255, 0.28)",
    edgeHighlight: "rgba(255, 255, 255, 0.55)",
    edgeLow: "rgba(255, 255, 255, 0.12)",
    sheen: "rgba(255, 255, 255, 0.08)",
    selectedBg: "rgba(10, 10, 14, 0.7)",
    pillBorder: "rgba(255, 255, 255, 0.25)",
    glow: "rgba(255, 255, 255, 0.6)",
    lightBg: "rgba(255, 255, 255, 0.7)",
    lightBlur: "16px",
    lightBorder: "rgba(255, 255, 255, 0.4)",
    lightShadow: "rgba(0, 0, 0, 0.1)",
  },
} as const;

export type Colors = typeof colors;
