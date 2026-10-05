"use client";

import React from "react";

interface PillButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}

export function PillButton({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled = false,
  className = "",
}: PillButtonProps) {
  // ⏳ PENDIENTE: acción de autenticación / conexión con el backend
  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  const variantClass = variant === "secondary" ? "ui-pill-btn--secondary" : "";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`ui-pill-btn ${variantClass} ${className}`}
    >
      {children}
    </button>
  );
}
