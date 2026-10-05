"use client";

import React from "react";
import { GoogleIcon } from "./GoogleIcon";

interface AccountCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AccountCard({
  title = "Usuario",
  subtitle = "Rol",
  icon = <GoogleIcon size={44} />,
  onClick,
  className = "",
}: AccountCardProps) {
  // ⏳ PENDIENTE: menú selector de cuentas activas o cambio de rol
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`ui-account-card ${className}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Cuenta seleccionada: ${title} (${subtitle})`}
    >
      <div className="ui-account-card__icon">{icon}</div>
      <div className="ui-account-card__divider" />
      <div className="ui-account-card__info">
        <span className="ui-account-card__title">{title}</span>
        <span className="ui-account-card__subtitle">{subtitle}</span>
      </div>
      <div className="ui-account-card__caret" aria-hidden="true">
        {/* Triángulo hacia abajo como en la referencia visual */}
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}
