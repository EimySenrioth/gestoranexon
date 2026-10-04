import React from "react";
import type { Metadata } from "next";
import { colors, typography, zIndex, spacing, motion } from "@/design-tokens";

export const metadata: Metadata = {
  title: "Tokens de diseño | Estancia Perú",
  description: "Catálogo visual del sistema de diseño (tokens v2)",
};

const sectionClass = "mb-16";
const h2Class = "mb-6 text-2xl font-bold italic text-accent-primary-text";

export default function TokensPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-8 py-12">
      <h1 className="mb-4 text-5xl font-black italic text-accent-title">
        Tokens de diseño
      </h1>
      <p className="mb-12 text-sm text-text-secondary">
        Arquitectura v2: TypeScript como única fuente de verdad, roles semánticos y geometría independiente del ancho.
      </p>

      {/* 1. Colores Semánticos */}
      <section className={sectionClass} id="colores">
        <h2 className={h2Class}>1. Colores Semánticos</h2>
        {Object.entries(colors).map(([group, values]) => (
          <div key={group} className="mb-8">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
              {group}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Object.entries(values).map(([name, value]) => (
                <div
                  key={name}
                  className="overflow-hidden rounded-md border border-border-divider-dark bg-background-card"
                >
                  <div className="h-14 w-full" style={{ background: value }} />
                  <div className="p-2 text-xs">
                    <p className="font-semibold text-text-primary">{name}</p>
                    <p className="font-mono text-[10px] text-text-secondary truncate">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 2. Tipografía Lagu Sans */}
      <section className={sectionClass} id="tipografia">
        <h2 className={h2Class}>2. Tipografía (Lagu Sans)</h2>
        <div className="space-y-3">
          {Object.entries(typography.fontWeight).map(([name, weight]) => (
            <div
              key={name}
              className="flex items-baseline gap-6 border-b border-border-divider-dark pb-2"
            >
              <span className="w-36 font-mono text-xs text-text-secondary">
                {name} ({weight})
              </span>
              <span className="text-xl" style={{ fontWeight: weight }}>
                Estancia Perú
              </span>
              <span className="text-xl italic text-text-secondary" style={{ fontWeight: weight }}>
                Estancia Perú Italic
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Polígonos con Chaflán en Píxeles Fijos */}
      <section className={sectionClass} id="poligonos">
        <h2 className={h2Class}>3. Polígonos (Chaflán en PX fijos)</h2>
        <p className="mb-6 text-xs text-text-secondary">
          Los cortes se calculan con <code>calc(100% - var(--cut))</code>. Compara el botón estándar vs uno con ancho largo o chaflán sobreescrito:
        </p>

        <div className="flex flex-col items-start gap-8">
          {/* Fila de ajuste */}
          <div className="shape row w-full">
            <div className="inner">.shape.row (ancho 100%, chaflanes laterales no se deforman)</div>
          </div>

          {/* Dropdown */}
          <div className="dropdown-wrap">
            <div className="dropdown w-72">
              <div className="inner">.dropdown con nodos laterales</div>
            </div>
          </div>

          {/* Pestañas */}
          <div className="flex gap-1">
            <button className="tab first active ui-interactive">Hot Deals</button>
            <button className="tab ui-interactive">New This Season</button>
            <button className="tab last ui-interactive">Riftcrystal Permit</button>
          </div>

          {/* Botones Purchase: Normal vs Ancho */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="purchase w-64 ui-interactive">
              <span className="inner">Purchase (256px)</span>
            </button>
            <button className="purchase w-96 ui-interactive">
              <span className="inner">Purchase ancho (384px)</span>
            </button>
          </div>

          {/* Botón menú lateral: Normal vs Override de cut */}
          <div className="flex flex-wrap items-center gap-4">
            <button className="side-btn active ui-interactive">.side-btn default</button>
            <button className="side-btn ui-interactive">.side-btn inactivo</button>
            <button
              className="side-btn active ui-interactive"
              style={{ "--cut": "22px" } as React.CSSProperties}
            >
              .side-btn (--cut: 22px override)
            </button>
          </div>

          {/* Grupo de misiones */}
          <div className="mission-group w-full">.mission-group con corte inclinado fijo</div>

          {/* Botones circulares */}
          <div className="flex gap-8">
            <button className="icon-btn ui-interactive">★</button>
            <button className="icon-btn active ui-interactive">
              ★<span className="badge">3</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4. Efectos de Vidrio */}
      <section
        className={`${sectionClass} rounded-2xl p-10`}
        id="vidrio"
        style={{
          background: `linear-gradient(135deg, ${colors.accent.primary}, ${colors.accent.progress})`,
        }}
      >
        <h2 className="mb-6 text-2xl font-bold italic text-white">4. Efectos de Vidrio (Glassmorphism)</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="fondo-vidrio-blanco p-6">
            <p className="font-bold">.fondo-vidrio-blanco</p>
            <p className="text-xs text-text-inverse-secondary mt-2">
              Fondo blanco al 70%, desenfoque 16px, borde sutil de cristal cortado y sombra suave.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="glass-row"><span>.glass-row</span></div>
            <div className="glass-row selected"><span>.glass-row.selected</span></div>
            <div className="glass-pill">.glass-pill (extremos redondeados)</div>
            <div className="glass-pill selected">.glass-pill.selected</div>
          </div>
        </div>
      </section>

      {/* 5. Z-Index */}
      <section className={sectionClass} id="z-index">
        <h2 className={h2Class}>5. Z-Index (4 Capas Estrictas)</h2>
        <p className="mb-4 text-xs text-text-secondary">
          Gobernanza: Prohibido usar números arbitrarios. Solo se usan las capas del sistema.
        </p>
        <div className="relative h-64">
          {Object.entries(zIndex).map(([name, z], i) => (
            <div
              key={name}
              className="absolute flex h-28 w-56 items-end rounded-xl border border-border-divider-dark p-3 font-mono text-sm shadow-xl"
              style={{
                zIndex: z,
                left: i * 60,
                top: i * 30,
                background: [
                  colors.background.card,
                  colors.background.slot,
                  colors.background.cardHover,
                  colors.accent.primary,
                ][i],
              }}
            >
              --ui-z-{name}: {z}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Spacing & Motion Tokens */}
      <section className={sectionClass} id="motion-spacing">
        <h2 className={h2Class}>6. Spacing & Motion Tokens</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border-divider-dark bg-background-card p-4">
            <h3 className="mb-3 text-sm font-bold text-accent-primary">spacing.cut & edge</h3>
            <pre className="font-mono text-xs text-text-secondary">
              {JSON.stringify(spacing, null, 2)}
            </pre>
          </div>
          <div className="rounded-lg border border-border-divider-dark bg-background-card p-4">
            <h3 className="mb-3 text-sm font-bold text-accent-primary">motion (duraciones y curvas)</h3>
            <pre className="font-mono text-xs text-text-secondary">
              {JSON.stringify(motion, null, 2)}
            </pre>
          </div>
        </div>
      </section>
    </main>
  );
}
