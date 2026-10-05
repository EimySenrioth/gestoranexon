// generate.ts — Genera generated/tokens.css y generated/theme.css desde tokens/*.ts
// Uso:  node src/design-tokens/sync/generate.ts          (escribe)
//       node src/design-tokens/sync/generate.ts --check  (exit 1 si hay diferencias)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { colors, glass } from "../tokens/colors.ts";
import { zIndex } from "../tokens/z-index.ts";
import { spacing } from "../tokens/spacing.ts";
import { motion } from "../tokens/motion.ts";
import { typography } from "../tokens/typography.ts";
import { effects } from "../tokens/effects.ts";

type Groups = Record<string, Record<string, string | number>>;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "generated");
const check = process.argv.includes("--check");

const kebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const uiVar = (group: string, key: string) => `--ui-${kebab(group)}-${kebab(key)}`;

const HEADER = `/* AUTO-GENERADO desde src/design-tokens/tokens/*.ts — NO EDITAR A MANO.
   Regenerar: npm run tokens:sync  ·  Verificar: npm run tokens:check
   Prohibido usar z-index numéricos sueltos: solo var(--ui-z-*). */
`;

function rootBlock(sections: [string, Groups][]): string {
  const lines = [HEADER, ":root {"];
  for (const [title, groups] of sections) {
    lines.push(`  /* ${title} */`);
    for (const [g, values] of Object.entries(groups)) {
      for (const [k, v] of Object.entries(values)) lines.push(`  ${uiVar(g, k)}: ${v};`);
    }
  }
  lines.push("}", "");
  return lines.join("\n");
}

function themeBlock(): string {
  const lines = [HEADER, "@theme inline {"];
  for (const [g, values] of Object.entries(colors as Groups)) {
    for (const k of Object.keys(values)) {
      lines.push(`  --color-${kebab(g)}-${kebab(k)}: var(${uiVar(g, k)});`);
    }
  }
  lines.push(`  --font-sans: var(${uiVar("fontFamily", "lagu")});`);
  lines.push(`  --font-lagu: var(${uiVar("fontFamily", "lagu")});`);
  lines.push("}", "");
  return lines.join("\n");
}

const outputs: Record<string, string> = {
  "tokens.css": rootBlock([
    ["Colores semánticos", colors as Groups],
    ["Vidrio (solo :root, sin utilidades Tailwind)", glass as Groups],
    ["Efectos y sombras", effects as Groups],
    ["Z-index", { z: zIndex } as Groups],
    ["Spacing", spacing as Groups],
    ["Motion", motion as Groups],
    ["Tipografía", typography as Groups],
  ]),
  "theme.css": themeBlock(),
};

// Validación: cada peso de typography.ts tiene @font-face normal e italic en fonts.css
function checkFonts(): string[] {
  const css = readFileSync(resolve(root, "fonts.css"), "utf-8");
  const faces = new Set<string>();
  for (const m of css.matchAll(/@font-face\s*{([^}]*)}/g)) {
    const w = /font-weight:\s*(\d+)/.exec(m[1])?.[1];
    const s = /font-style:\s*(\w+)/.exec(m[1])?.[1] ?? "normal";
    if (w) faces.add(`${w}/${s}`);
  }
  const errors: string[] = [];
  for (const [name, w] of Object.entries(typography.fontWeight)) {
    for (const style of ["normal", "italic"]) {
      if (!faces.has(`${w}/${style}`)) errors.push(`Falta @font-face ${name} (${w}) ${style} en fonts.css`);
    }
  }
  return errors;
}

const errors = checkFonts();

if (check) {
  for (const [file, content] of Object.entries(outputs)) {
    const path = resolve(outDir, file);
    const current = existsSync(path) ? readFileSync(path, "utf-8") : "";
    if (current !== content) errors.push(`generated/${file} está desactualizado. Ejecuta npm run tokens:sync`);
  }
} else {
  mkdirSync(outDir, { recursive: true });
  for (const [file, content] of Object.entries(outputs)) writeFileSync(resolve(outDir, file), content, "utf-8");
  console.log("[design-tokens] generated/tokens.css y generated/theme.css actualizados");
}

if (errors.length) {
  for (const e of errors) console.error(`[design-tokens] ✖ ${e}`);
  process.exit(1);
}
if (check) console.log("[design-tokens] ✔ Tokens sincronizados");
