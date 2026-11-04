"use client";

import React from "react";

export interface PageIndicatorProps {
  total: number;
  current: number; // 0-based index
  onChange?: (index: number) => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * PageIndicator — Indicadores de página / carrusel (dots) estilo Hoyoverse / Zenless Zone Zero.
 */
export function PageIndicator({
  total,
  current,
  onChange,
  className = "",
  ariaLabel = "Indicador de página",
}: PageIndicatorProps) {
  if (total <= 1) return null;

  return (
    <nav
      className={`banner-modal-dots ${className}`}
      aria-label={ariaLabel}
      role="tablist"
    >
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Página ${i + 1} de ${total}`}
            tabIndex={isActive ? 0 : -1}
            className={`banner-modal-dot ${isActive ? "banner-modal-dot--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onChange && !isActive) {
                onChange(i);
              }
            }}
          />
        );
      })}
    </nav>
  );
}

