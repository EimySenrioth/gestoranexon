"use client";

import React from "react";

interface UsuariosPaginationProps {
  hasPrevPage: boolean;
  hasNextPage: boolean;
  numeroLoteActual: number;
  mostradosEnLote: number;
  totalCategoria: number;
  isLoading?: boolean;
  onAnteriorCursor: () => void;
  onSiguienteCursor: () => void;
}

export function UsuariosPagination({
  hasPrevPage,
  hasNextPage,
  numeroLoteActual,
  mostradosEnLote,
  totalCategoria,
  isLoading = false,
  onAnteriorCursor,
  onSiguienteCursor,
}: UsuariosPaginationProps) {
  if (!hasPrevPage && !hasNextPage && totalCategoria <= mostradosEnLote) {
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 16px",
        borderTop: "1px solid #edebe9",
        background: "#faf9f8",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "0.82rem", color: "#616161" }}>
        Mostrando <strong>{mostradosEnLote}</strong> de{" "}
        <strong>{totalCategoria}</strong> registros · Lote #{numeroLoteActual}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          className="admin-action-btn"
          disabled={!hasPrevPage || isLoading}
          onClick={onAnteriorCursor}
          style={{
            opacity: !hasPrevPage || isLoading ? 0.5 : 1,
            cursor: !hasPrevPage || isLoading ? "not-allowed" : "pointer",
          }}
        >
          ‹ Anterior
        </button>

        <button
          type="button"
          className="admin-action-btn"
          disabled={!hasNextPage || isLoading}
          onClick={onSiguienteCursor}
          style={{
            opacity: !hasNextPage || isLoading ? 0.5 : 1,
            cursor: !hasNextPage || isLoading ? "not-allowed" : "pointer",
          }}
        >
          Siguiente ›
        </button>
      </div>
    </div>
  );
}
