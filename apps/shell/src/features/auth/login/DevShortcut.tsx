import React from "react";
import Link from "next/link";

/**
 * Acceso directo a la página de tokens de diseño.
 * Solo se renderiza en entorno de desarrollo (NODE_ENV !== "production").
 */
export function DevShortcut() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="flex justify-center w-full">
      <Link href="/inicio" className="ui-dev-btn" title="Ir a la pantalla de inicio">
        <span aria-hidden="true">🚀</span>
        <span>Modo desarrollo → Ir a Inicio</span>
      </Link>
    </div>
  );
}
