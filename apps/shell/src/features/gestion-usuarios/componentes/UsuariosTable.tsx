"use client";

import React, { useState } from "react";
import { UsuarioItem } from "../types/usuarios.types";
import { UsuariosTableRow } from "./UsuariosTableRow";
import { UsuariosPagination } from "./UsuariosPagination";

interface UsuariosTableProps {
  usuarios: UsuarioItem[];
  isLoading?: boolean;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  numeroLoteActual: number;
  totalCategoria: number;
  onAnteriorCursor: () => void;
  onSiguienteCursor: () => void;
  onSelectUser: (usuario: UsuarioItem) => void;
}

export function UsuariosTable({
  usuarios,
  isLoading = false,
  hasPrevPage,
  hasNextPage,
  numeroLoteActual,
  totalCategoria,
  onAnteriorCursor,
  onSiguienteCursor,
  onSelectUser,
}: UsuariosTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isAllSelected =
    usuarios.length > 0 && usuarios.every((u) => selectedIds.includes(u.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !usuarios.some((u) => u.id === id))
      );
    } else {
      const currentIds = usuarios.map((u) => u.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="admin-table-wrapper">
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead className="admin-table-head">
            <tr>
              <th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  aria-label="Seleccionar todos los usuarios mostrados"
                  style={{ cursor: "pointer" }}
                />
              </th>
              <th>Nombre completo ⇅</th>
              <th>Correo electrónico (UPN) ⇅</th>
              <th>Rol asignado</th>
              <th>Estado</th>
              <th>Fecha de registro</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "36px",
                    textAlign: "center",
                    color: "#616161",
                    fontSize: "0.95rem",
                  }}
                >
                  Cargando usuarios desde la base de datos...
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    padding: "36px",
                    textAlign: "center",
                    color: "#8a8886",
                    fontSize: "0.95rem",
                  }}
                >
                  No se encontraron usuarios registrados que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <UsuariosTableRow
                  key={usuario.id}
                  usuario={usuario}
                  isSelected={selectedIds.includes(usuario.id)}
                  onToggleSelect={handleToggleSelect}
                  onSelectUser={onSelectUser}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <UsuariosPagination
        hasPrevPage={hasPrevPage}
        hasNextPage={hasNextPage}
        numeroLoteActual={numeroLoteActual}
        mostradosEnLote={usuarios.length}
        totalCategoria={totalCategoria}
        isLoading={isLoading}
        onAnteriorCursor={onAnteriorCursor}
        onSiguienteCursor={onSiguienteCursor}
      />
    </div>
  );
}
