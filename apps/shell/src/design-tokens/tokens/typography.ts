// typography.ts — Cada peso debe tener su @font-face (normal e italic) en fonts.css.
// `npm run tokens:check` lo valida.
export const typography = {
  fontFamily: { lagu: '"Lagu Sans", system-ui, sans-serif' },
  fontWeight: {
    thin: 100, extralight: 200, light: 300, regular: 400, medium: 500,
    semibold: 600, bold: 700, extrabold: 800, black: 900,
  },
  fontSize: {
    xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.25rem",
    xl: "1.5rem", "2xl": "2rem", "3xl": "3rem",
  },
} as const;
