// spacing.ts — Grosores, radios y chaflanes (px fijos: no se deforman con el ancho)
export const spacing = {
  edge: { thin: "1px", normal: "2px", thick: "4px", frame: "6px" },
  radius: { sm: "4px", md: "8px", lg: "16px", xl: "20px", dialog: "18px", pill: "9999px" },
  cut: { sm: "8px", md: "12px", lg: "22px" },
} as const;
