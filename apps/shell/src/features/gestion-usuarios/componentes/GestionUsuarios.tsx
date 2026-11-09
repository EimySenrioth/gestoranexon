"use client";

import React, { useState, useMemo } from "react";
import { CategoriaUsuario, UsuarioItem } from "../types/usuarios.types";
import {
  MOCK_USUARIOS_EVALUADORES,
  MOCK_USUARIOS_SOLICITANTES,
} from "../mocks/usuarios.mock";
import { UsuariosTabs } from "./UsuariosTabs";
import { UsuariosToolbar } from "./UsuariosToolbar";
import { UsuariosTable } from "./UsuariosTable";
import { UsuarioFlyoutDrawer } from "../modales/UsuarioFlyoutDrawer";

export function GestionUsuarios() {
  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaUsuario>("EVALUADOR");
  const [busqueda, setBusqueda] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lista base según pestaña activa
  const listaBase = useMemo(() => {
    return categoriaActiva === "EVALUADOR"
      ? MOCK_USUARIOS_EVALUADORES
      : MOCK_USUARIOS_SOLICITANTES;
  }, [categoriaActiva]);

  // Filtrado por texto de búsqueda
  const usuariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return listaBase;
    const term = busqueda.toLowerCase().trim();
    return listaBase.filter(
      (u) =>
        u.nombre.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.rolEtiqueta.toLowerCase().includes(term) ||
        (u.departamento && u.departamento.toLowerCase().includes(term))
    );
  }, [listaBase, busqueda]);

  const handleSelectUser = (usuario: UsuarioItem) => {
    setUsuarioSeleccionado(usuario);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="admin-users-container">
      {/* 1. Migas de Pan estilo Azure Portal */}
      <nav aria-label="Migas de pan" className="admin-breadcrumb">
        <span>Inicio</span>
        <span className="admin-breadcrumb-separator">/</span>
        <span>Administración</span>
        <span className="admin-breadcrumb-separator">/</span>
        <strong style={{ color: "#242424" }}>Gestión de Usuarios</strong>
      </nav>

      {/* 2. Cabecera con título y acciones superiores */}
      <div className="admin-header-title-row">
        <div className="admin-header-title-box">
          <div className="admin-header-icon-badge" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="admin-header-title">Gestión de Usuarios | Directorio</h1>
            <p className="admin-header-subtitle">
              Administración centralizada de cuentas, roles y credenciales del sistema
            </p>
          </div>
        </div>

        {/* Botones de acción Azure */}
        <div className="admin-actions-group">
          <button
            type="button"
            className="admin-action-btn admin-action-btn-primary"
            onClick={() => {
              // Abrir drawer con usuario plantilla para nuevo usuario
              handleSelectUser({
                id: `usr-new-${Date.now()}`,
                nombre: "",
                email: "",
                passwordEnmascarada: "••••••••••••",
                categoria: categoriaActiva,
                rol: categoriaActiva === "EVALUADOR" ? "EVALUADOR" : "SOLICITANTE",
                rolEtiqueta:
                  categoriaActiva === "EVALUADOR" ? "Evaluador Ético" : "Solicitante",
                habilitado: true,
                avatarColor: "#0078d4",
                iniciales: "+",
                fechaRegistro: new Date().toISOString().split("T")[0],
                departamento: "UNTELS",
              });
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nuevo usuario</span>
          </button>

          <button
            type="button"
            className="admin-action-btn"
            title="Descargar lista de usuarios"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Descargar</span>
          </button>

          <button
            type="button"
            className="admin-action-btn"
            onClick={() => setBusqueda("")}
            title="Actualizar lista"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 3. Banner Informativo Azure (Entra ID Style) */}
      <div className="admin-azure-alert" role="status">
        <svg
          className="admin-azure-alert-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div>
          <strong>Consola de Administración UNTELS:</strong> Selecciona un usuario
          de la lista para desplegar el panel lateral derecho con el detalle de su
          cuenta y credenciales.
        </div>
      </div>

      {/* 4. Barra de Herramientas con Pestañas */}
      <div className="admin-toolbar-row">
        <UsuariosTabs
          categoriaActiva={categoriaActiva}
          onCambiarCategoria={(cat) => {
            setCategoriaActiva(cat);
            setBusqueda("");
          }}
          conteoEvaluadores={MOCK_USUARIOS_EVALUADORES.length}
          conteoSolicitantes={MOCK_USUARIOS_SOLICITANTES.length}
        />

        <UsuariosToolbar
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          totalEncontrados={usuariosFiltrados.length}
        />
      </div>

      {/* 5. Tabla de Usuarios Azure */}
      <UsuariosTable
        usuarios={usuariosFiltrados}
        onSelectUser={handleSelectUser}
      />

      {/* 6. Modal Lateral Derecho (Flyout Drawer) */}
      <UsuarioFlyoutDrawer
        usuario={usuarioSeleccionado}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </div>
  );
}

