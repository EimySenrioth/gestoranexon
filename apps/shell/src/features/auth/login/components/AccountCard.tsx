"use client";

import React from "react";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";

interface AccountCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AccountCard({
  title = "Usuario",
  subtitle = "",
  icon = <GoogleIcon size={44} />,
  onClick,
  className = "",
}: AccountCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`ui-account-card ${className}`}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleClick();
              }
            }
          : undefined
      }
      aria-label={subtitle ? `Cuenta seleccionada: ${title} (${subtitle})` : `Cuenta: ${title}`}
    >
      <div className="ui-account-card__icon">{icon}</div>
      <div className="ui-account-card__divider" />
      <div className="ui-account-card__info">
        <span className="ui-account-card__title">{title}</span>
        {subtitle && (
          <span className="ui-account-card__subtitle">{subtitle}</span>
        )}
      </div>
      {onClick && (
        <div className="ui-account-card__caret" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      )}
    </div>
  );
}
