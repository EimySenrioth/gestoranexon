"use client";

import React, { useState } from "react";
import { UsuarioItem } from "../types/usuarios.types";
import { UsuariosTableRow } from "./UsuariosTableRow";
import { UsuariosPagination } from "./UsuariosPagination";

interface UsuariosTableProps {
  usuarios: UsuarioItem[];
  onSelectUser: (usuario: UsuarioItem) => void;
}

export function UsuariosTable({ usuarios, onSelectUser }: UsuariosTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 8;

  const totalPaginas = Math.ceil(usuarios.length / itemsPorPagina);
  const indiceInicio = (pagina - 1) * itemsPorPagina;
  const usuariosPaginados = usuarios.slice(indiceInicio, indiceInicio + itemsPorPagina);

  const isAllSelected =
    usuariosPaginados.length > 0 &&
    usuariosPaginados.every((u) => selectedIds.includes(u.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !usuariosPaginados.some((u) => u.id === id))
      );
    } else {
      const currentIds = usuariosPaginados.map((u) => u.id);
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
              <th>Departamento / Facultad</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPaginados.length === 0 ? (
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
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              usuariosPaginados.map((usuario) => (
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
        paginaActual={pagina}
        totalPaginas={totalPaginas}
        onCambiarPagina={setPagina}
      />
    </div>
  );
}

