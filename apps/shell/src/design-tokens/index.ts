// index.ts — Barrel export público de design-tokens (solo para lógica TypeScript)
// ⚠️ palette.ts es interna y NO se exporta aquí.

export { colors, glass } from "./tokens/colors.ts";
export { zIndex } from "./tokens/z-index.ts";
export { spacing } from "./tokens/spacing.ts";
export { motion } from "./tokens/motion.ts";
export { typography } from "./tokens/typography.ts";

import { colors } from "./tokens/colors.ts";
import { zIndex } from "./tokens/z-index.ts";

// Tipos utilitarios para props y componentes
export type ColorGroup = keyof typeof colors;
export type ColorToken<G extends ColorGroup> = keyof (typeof colors)[G];
export type ZIndexLevel = keyof typeof zIndex;
export type PolygonClass =
  | "shape"
  | "row"
  | "dropdown"
  | "tab"
  | "purchase"
  | "side-btn"
  | "mission-group"
  | "icon-btn";
