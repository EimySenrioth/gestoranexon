// effects.ts — Sombras y efectos visuales.
// Nota: Contienen rgba(), por lo que solo generan variables CSS (--ui-shadow-*) en :root.
export const effects = {
  shadow: {
    card: "0 4px 14px rgba(0, 0, 0, 0.08)",
    dialog: "0 16px 40px rgba(0, 0, 0, 0.35)",
    pill: "0 2px 4px rgba(0, 0, 0, 0.06)",
  },
} as const;

export type Effects = typeof effects;
