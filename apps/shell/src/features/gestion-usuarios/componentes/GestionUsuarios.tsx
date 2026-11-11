"use client";

import React, { useState } from "react";
import { UsuarioItem } from "../types/usuarios.types";
import { useUsuariosCursorTabla } from "../hooks/useUsuariosCursorTabla";
import { UsuariosTabs } from "./UsuariosTabs";
import { UsuariosToolbar } from "./UsuariosToolbar";
import { UsuariosTable } from "./UsuariosTable";
import { UsuarioFlyoutDrawer } from "../modales/UsuarioFlyoutDrawer";

export function GestionUsuarios() {
  const {
    categoriaActiva,
    cambiarCategoria,
    busqueda,
    setBusqueda,
    usuarios,
    isLoading,
    conteos,
    rolesDisponibles,
    pageInfo,
    irSiguienteCursor,
    irAnteriorCursor,
    refrescarTabla,
  } = useUsuariosCursorTabla(8);

  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<UsuarioItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
            <h1 className="admin-header-title">
              Gestión de Usuarios | Directorio
            </h1>
            <p className="admin-header-subtitle">
              Administración centralizada de cuentas, roles y credenciales del
              sistema
            </p>
          </div>
        </div>

        {/* Botones de acción Azure */}
        <div className="admin-actions-group">
          <button
            type="button"
            className="admin-action-btn admin-action-btn-primary"
            onClick={() => {
              const esPestanaAdmin = categoriaActiva === "ADMINISTRADOR";
              handleSelectUser({
                id: `usr-new-${Date.now()}`,
                nombre: "",
                apellido: "",
                nombreCompleto: "",
                email: "",
                passwordEnmascarada: "••••••••••••",
                categoria: esPestanaAdmin ? "ADMINISTRADOR" : "SOLICITANTE",
                rolId: esPestanaAdmin ? 8 : 1,
                rol: esPestanaAdmin ? "ADMINISTRADOR" : "SOLICITANTE",
                rolEtiqueta: esPestanaAdmin
                  ? "Administrador"
                  : "Solicitante / Investigador",
                habilitado: true,
                avatarColor: esPestanaAdmin ? "#242424" : "#0078d4",
                iniciales: "+",
                creadoEn: new Date().toISOString(),
                fechaRegistro: new Date().toISOString().split("T")[0],
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
            onClick={() => {
              setBusqueda("");
              refrescarTabla(true);
            }}
            title="Actualizar lista desde la base de datos"
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
          <strong>Consola de Administración UNTELS:</strong> Selecciona un
          usuario de la lista para desplegar el panel lateral derecho con el
          detalle de su cuenta y credenciales.
        </div>
      </div>

      {/* 4. Barra de Herramientas con Pestañas */}
      <div className="admin-toolbar-row">
        <UsuariosTabs
          categoriaActiva={categoriaActiva}
          onCambiarCategoria={cambiarCategoria}
          conteoEvaluadores={conteos.totalEvaluadores}
          conteoSolicitantes={conteos.totalSolicitantes}
          conteoAdministradores={conteos.totalAdministradores}
        />

        <UsuariosToolbar
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          totalEncontrados={pageInfo.totalCategoria}
          onRefresh={() => refrescarTabla(true)}
        />
      </div>

      {/* 5. Tabla de Usuarios Azure con Paginación por Cursor */}
      <UsuariosTable
        usuarios={usuarios}
        isLoading={isLoading}
        hasPrevPage={pageInfo.hasPrevPage}
        hasNextPage={pageInfo.hasNextPage}
        numeroLoteActual={pageInfo.numeroLoteActual}
        totalCategoria={pageInfo.totalCategoria}
        onAnteriorCursor={irAnteriorCursor}
        onSiguienteCursor={irSiguienteCursor}
        onSelectUser={handleSelectUser}
      />

      {/* 6. Modal Lateral Derecho (Flyout Drawer) */}
      <UsuarioFlyoutDrawer
        usuario={usuarioSeleccionado}
        rolesDisponibles={rolesDisponibles}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSaved={() => refrescarTabla(false)}
      />
    </div>
  );
}
