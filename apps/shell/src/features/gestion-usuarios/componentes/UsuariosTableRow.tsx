"use client";

import React from "react";
import { UsuarioItem } from "../types/usuarios.types";

interface UsuariosTableRowProps {
  usuario: UsuarioItem;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onSelectUser: (usuario: UsuarioItem) => void;
}

export function UsuariosTableRow({
  usuario,
  isSelected = false,
  onToggleSelect,
  onSelectUser,
}: UsuariosTableRowProps) {
  return (
    <tr
      className="admin-table-row"
      onClick={() => onSelectUser(usuario)}
      title="Haz clic para ver o editar la información en el panel lateral"
    >
      {/* Checkbox de selección */}
      <td
        className="admin-table-cell"
        style={{ width: "40px" }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect?.(usuario.id);
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect?.(usuario.id)}
          aria-label={`Seleccionar ${usuario.nombre}`}
          style={{ cursor: "pointer" }}
        />
      </td>

      {/* Nombre y Avatar circular */}
      <td className="admin-table-cell">
        <div className="admin-user-name-cell">
          <div
            className="admin-user-avatar"
            style={{ backgroundColor: usuario.avatarColor }}
            aria-hidden="true"
          >
            {usuario.iniciales}
          </div>
          <button
            type="button"
            className="admin-user-name-link"
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {usuario.nombre}
          </button>
        </div>
      </td>

      {/* Correo Electrónico (User Principal Name) */}
      <td className="admin-table-cell" style={{ color: "#242424" }}>
        {usuario.email}
      </td>

      {/* Rol / Tipo de Usuario */}
      <td className="admin-table-cell">
        <span className="admin-role-badge">{usuario.rolEtiqueta}</span>
      </td>

      {/* Estado Habilitado (Enabled: Yes / No) */}
      <td className="admin-table-cell">
        {usuario.habilitado ? (
          <span className="admin-status-enabled">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Habilitado</span>
          </span>
        ) : (
          <span className="admin-status-disabled">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            <span>Inactivo</span>
          </span>
        )}
      </td>

      {/* Departamento / Unidad */}
      <td className="admin-table-cell" style={{ color: "#616161", fontSize: "0.82rem" }}>
        {usuario.departamento || "—"}
      </td>
    </tr>
  );
}

