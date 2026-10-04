# Sincronización Automática de Tokens (`tokens/*.ts` → `generated/*.css`)

El directorio `src/design-tokens/` utiliza **TypeScript como única fuente de verdad** para todos los valores del sistema de diseño que consume la lógica o la UI.

---

## Estructura

```text
src/design-tokens/
├── tokens/               ← FUENTE EDITABLE (TypeScript)
│   ├── palette.ts        ← Primitivos (NO se exporta ni genera CSS)
│   ├── colors.ts         ← Roles semánticos (referencia palette) y params de glass
│   ├── z-index.ts        ← Capas de elevación
│   ├── spacing.ts        ← Grosores, radios y chaflanes (px fijos)
│   ├── motion.ts         ← Duraciones y curvas
│   └── typography.ts     ← Pesos y escalas (validados contra fonts.css)
├── generated/            ← SALIDA AUTO-GENERADA (No editar a mano)
│   ├── tokens.css        ← :root { --ui-* }
│   └── theme.css         ← @theme inline { --color-*: var(--ui-*); }
├── fonts.css             ← @font-face Lagu Sans
├── polygons.css          ← Geometría clip-path declarada por selector
├── glass.css             ← Paneles y efectos de vidrio
├── motion.css            ← .ui-interactive + @media (prefers-reduced-motion)
├── global.css            ← Orquestador con imports
└── index.ts              ← Barrel export de TypeScript
```

---

## Comandos

```bash
# Sincronizar (regenera generated/tokens.css y generated/theme.css)
npm run tokens:sync

# Verificar en CI o pre-commit (falla con exit 1 si hay desfasaje o faltan fuentes)
npm run tokens:check
```

> **Automatización:** Tanto `npm run dev` como `npm run build` ejecutan `tokens:sync` en sus hooks `predev` y `prebuild`.

---

## Tabla de Equivalencias (Nombres anteriores → Convención actual)

Todos los tokens siguen ahora la convención estricta:  
`grupo.clave` → `--ui-{grupo}-{clave}` → Tailwind `--color-{grupo}-{clave}`

| Anterior (v1) | Actual (v2) | Tailwind |
| :--- | :--- | :--- |
| `--ui-bg-app-dark` | `--ui-background-app` | `bg-background-app` |
| `--ui-bg-panel-dark` | `--ui-background-panel` | `bg-background-panel` |
| `--ui-bg-card-dark` | `--ui-background-card` | `bg-background-card` |
| `--ui-bg-card-dark-hover` | `--ui-background-card-hover` | `bg-background-card-hover` |
| `--ui-bg-slot-dark` | `--ui-background-slot` | `bg-background-slot` |
| `--ui-accent-magenta` | `--ui-accent-primary` | `bg-accent-primary`, `text-accent-primary` |
| `--ui-accent-magenta-text` | `--ui-accent-primary-text` | `text-accent-primary-text` |
| `--ui-accent-yellow` | `--ui-accent-cta` | `bg-accent-cta`, `text-accent-cta` |
| `--ui-accent-yellow-title`| `--ui-accent-title` | `text-accent-title` |
| `--ui-accent-cyan` | `--ui-accent-progress` | `bg-accent-progress` |
| `--ui-accent-lime` | `--ui-accent-highlight` | `bg-accent-highlight` |
| `--ui-status-notification-red` | `--ui-status-notification` | `bg-status-notification` |
| `--z-*` | `--ui-z-*` | `z-base`, `z-modal` |

---

## Reglas de Gobernanza

1. **Paleta interna:** `palette.ts` nunca se exporta ni genera variables CSS. Los componentes consumen solo nombres semánticos (`colors.accent.primary`, no `colors.pink500`).
2. **Z-index:** Prohibido utilizar números mágicos arbitrarios en el código. Usar exclusivamente `var(--ui-z-*)` o utilidades Tailwind.
3. **Chaflanes fijos:** Los polígonos usan `--cut: var(--ui-cut-*)` con píxeles fijos y `calc()` para no deformarse según el ancho del componente.
4. **Motion accesible:** Toda animación interactiva debe respetar `@media (prefers-reduced-motion: reduce)`.
