"use client";

import React from "react";

interface DialogProps {
  children: React.ReactNode;
  onClose?: () => void;
  showClose?: boolean;
  closeLabel?: string;
  className?: string;
}

export function Dialog({
  children,
  onClose,
  showClose = Boolean(onClose),
  closeLabel = "Cerrar ventana",
  className = "",
}: DialogProps) {
  // ⏳ PENDIENTE: acción de cierre del modal o retorno
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={`ui-dialog ${className}`} role="dialog" aria-modal="true">
      <header className="ui-dialog__header">
        {showClose && onClose ? (
          <button
            type="button"
            className="ui-dialog__close"
            onClick={handleClose}
            aria-label={closeLabel}
          >
          {/* Icono X estilizado como en la referencia visual */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="22" y2="22" />
            <line x1="22" y1="6" x2="6" y2="22" />
          </svg>
          </button>
        ) : null}
      </header>

      <section className="ui-dialog__body">{children}</section>
    </div>
  );
}
