// motion.ts — Duraciones y curvas de las transiciones
export const motion = {
  duration: { fast: "120ms", normal: "240ms", glow: "400ms" },
  ease: { snappy: "cubic-bezier(0.16, 1, 0.3, 1)", glow: "ease-in-out" },
} as const;
