"use client";

import React, { useEffect, useCallback } from "react";

export interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  headerIcon?: React.ReactNode;
  watermarkText?: string;
  showCloseButton?: boolean;
  closeLabel?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  className?: string;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
}

/**
 * BannerModal — Componente base de diálogo estilo Hoyoverse (Zenless Zone Zero).
 * Estructura de tres franjas: Cabecera superior oscura, cuerpo central contrastante y pie oscuro con acciones.
 */
export function BannerModal({
  isOpen,
  onClose,
  title,
  headerIcon,
  watermarkText = "SISTEMA · CEI",
  showCloseButton = true,
  closeLabel = "Cerrar modal",
  children,
  footerActions,
  className = "",
  closeOnOverlayClick = true,
  closeOnEsc = true,
}: BannerModalProps) {
  // Manejo de tecla Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === "Escape") {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  // Bloqueo de scroll en body mientras está abierto
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="banner-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`banner-modal-window ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Cabecera Oscura */}
        <header className="banner-modal-header">
          {watermarkText && (
            <div className="banner-modal-watermark" aria-hidden="true">
              {watermarkText}
            </div>
          )}

          <div className="banner-modal-title-wrap">
            {headerIcon && <div className="flex-shrink-0">{headerIcon}</div>}
            {title && <h2 className="banner-modal-title">{title}</h2>}
          </div>

          {showCloseButton && (
            <button
              type="button"
              className="banner-modal-close-btn"
              onClick={onClose}
              aria-label={closeLabel}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </button>
          )}
        </header>

        {/* 2. Cuerpo Central Claro */}
        <section className="banner-modal-body">{children}</section>

        {/* 3. Pie Inferior Oscuro */}
        {footerActions && (
          <footer className="banner-modal-footer">{footerActions}</footer>
        )}
      </div>
    </div>
  );
}
