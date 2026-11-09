"use client";

import React from "react";

interface UsuariosPaginationProps {
  paginaActual: number;
  totalPaginas: number;
  onCambiarPagina: (pagina: number) => void;
}

export function UsuariosPagination({
  paginaActual,
  totalPaginas,
  onCambiarPagina,
}: UsuariosPaginationProps) {
  if (totalPaginas <= 1) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "8px",
        padding: "12px 16px",
        borderTop: "1px solid #edebe9",
        background: "#faf9f8",
      }}
    >
      <button
        type="button"
        className="admin-action-btn"
        disabled={paginaActual <= 1}
        onClick={() => onCambiarPagina(paginaActual - 1)}
        style={{
          opacity: paginaActual <= 1 ? 0.5 : 1,
          cursor: paginaActual <= 1 ? "not-allowed" : "pointer",
        }}
      >
        ‹ Anterior
      </button>

      <span style={{ fontSize: "0.85rem", color: "#616161" }}>
        Página {paginaActual} de {totalPaginas}
      </span>

      <button
        type="button"
        className="admin-action-btn"
        disabled={paginaActual >= totalPaginas}
        onClick={() => onCambiarPagina(paginaActual + 1)}
        style={{
          opacity: paginaActual >= totalPaginas ? 0.5 : 1,
          cursor: paginaActual >= totalPaginas ? "not-allowed" : "pointer",
        }}
      >
        Siguiente ›
      </button>
    </div>
  );
}

