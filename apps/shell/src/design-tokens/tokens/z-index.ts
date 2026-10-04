// z-index.ts — 4 capas. Prohibido usar números sueltos: solo var(--ui-z-*).
export const zIndex = {
  base: 0, // contenido
  dropdown: 100, // dropdowns, tooltips
  overlay: 500, // fondo oscuro detrás de modales
  modal: 1000, // modales, toasts
} as const;
