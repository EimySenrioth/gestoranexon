"use client";

import React from "react";
import { CategoriaUsuario } from "../types/usuarios.types";

interface UsuariosTabsProps {
  categoriaActiva: CategoriaUsuario;
  onCambiarCategoria: (categoria: CategoriaUsuario) => void;
  conteoEvaluadores: number;
  conteoSolicitantes: number;
}

export function UsuariosTabs({
  categoriaActiva,
  onCambiarCategoria,
  conteoEvaluadores,
  conteoSolicitantes,
}: UsuariosTabsProps) {
  return (
    <div className="admin-tabs-list" role="tablist" aria-label="Categorías de usuarios">
      <button
        type="button"
        role="tab"
        aria-selected={categoriaActiva === "EVALUADOR"}
        className={`admin-tab-btn ${categoriaActiva === "EVALUADOR" ? "active" : ""}`}
        onClick={() => onCambiarCategoria("EVALUADOR")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Evaluadores (CEI)</span>
        <span className="admin-tab-badge">{conteoEvaluadores}</span>
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={categoriaActiva === "SOLICITANTE"}
        className={`admin-tab-btn ${categoriaActiva === "SOLICITANTE" ? "active" : ""}`}
        onClick={() => onCambiarCategoria("SOLICITANTE")}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Usuarios Solicitantes</span>
        <span className="admin-tab-badge">{conteoSolicitantes}</span>
      </button>
    </div>
  );
}

