"use client";

import React from "react";

interface UsuariosToolbarProps {
  busqueda: string;
  onBusquedaChange: (val: string) => void;
  totalEncontrados: number;
  onRefresh?: () => void;
}

export function UsuariosToolbar({
  busqueda,
  onBusquedaChange,
  totalEncontrados,
  onRefresh,
}: UsuariosToolbarProps) {
  return (
    <div className="admin-search-bar-row">
      {/* Input de Búsqueda estilo Azure */}
      <div className="admin-search-input-box">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "#616161" }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="admin-search-input"
          placeholder="Buscar por nombre, correo electrónico o rol..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          aria-label="Buscar usuarios"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => onBusquedaChange("")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#8a8886",
              padding: "2px",
            }}
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="admin-count-text">
        <strong>{totalEncontrados}</strong> usuarios encontrados
      </div>
    </div>
  );
}

