// palette.ts — Colores PRIMITIVOS. Uso interno de tokens/*.ts.
// ⚠️ No se exporta desde index.ts ni genera variables CSS: los componentes
// solo deben consumir los roles semánticos de colors.ts.

export const palette = {
  dark950: "#0D0D0D",
  dark900: "#1A1A1A",
  dark880: "#1A1A1F",
  dark850: "#222222",
  dark800: "#262626",
  dark750: "#2A2A2A",
  dark700: "#2D2D2D",
  dark650: "#333333",
  slate950: "#141620",

  gray600: "#555555",
  gray500: "#757575",
  gray400: "#A3A3A3",
  gray350: "#AAAAAA",
  gray300: "#CFCFCF",
  gray250: "#D4D4D4",
  gray200: "#E0E0E0",
  gray150: "#ECECEC",
  gray100: "#F5F5F5",

  white: "#FFFFFF",
  black: "#000000",

  pink500: "#FF2A6D",
  pink500Alpha40: "rgba(255, 42, 109, 0.4)",
  pink400: "#FF6699",
  plum700: "#A0206A",
  yellow400: "#FFEB3B",
  yellow500: "#FFD700",
  cyan400: "#00E5FF",
  lime300: "#DDF259",
  red500: "#FF1744",
  coral400: "#FF6B6B",
  blackAlpha70: "rgba(0, 0, 0, 0.7)",
} as const;
