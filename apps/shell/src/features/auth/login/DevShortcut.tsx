"use client";

import React from "react";
import { useRouter } from "next/navigation";
import "./DevShortcut.css";

/**
 * Selector de vistas en modo desarrollo.
 * Permite cambiar ágilmente entre Inicio, HomeView2 y otras rutas.
 * Solo se renderiza en entorno de desarrollo (NODE_ENV !== "production").
 */
export function DevShortcut() {
  const router = useRouter();

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetUrl = e.target.value;
    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  return (
    <div className="flex justify-center w-full">
      <div className="ui-dev-selector-wrapper">
        <label htmlFor="dev-view-selector" className="ui-dev-selector-label">
          Modo Desarrollo:
        </label>
        <select
          id="dev-view-selector"
          className="ui-dev-selector-select"
          defaultValue=""
          onChange={handleChange}
          aria-label="Selector de vistas en modo desarrollador"
        >
          <option value="" disabled>
            Seleccionar vista...
          </option>
          <option value="/inicio">Inicio 1 (Dashboard)</option>
          <option value="/homeview2">HomeView 2 (Tabla Azure)</option>
        </select>
      </div>
    </div>
  );
}
