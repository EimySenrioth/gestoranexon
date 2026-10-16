import React from "react";
import Link from "next/link";

interface CreateRequestButtonProps {
  href?: string;
  label?: string;
  onClick?: () => void;
}

export function CreateRequestButton({
  href = "/solicitudes",
  label = "Crear Solicitud",
  onClick,
}: CreateRequestButtonProps) {
  if (href) {
    return (
      <Link href={href} className="empty-state-btn" onClick={onClick}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" className="empty-state-btn" onClick={onClick}>
      {label}
    </button>
  );
}
