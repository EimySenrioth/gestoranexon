"use client";

import React, { useEffect, useState } from "react";
import { UsuarioItem } from "../types/usuarios.types";

interface UsuarioFlyoutDrawerProps {
  usuario: UsuarioItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UsuarioFlyoutDrawer({
  usuario,
  isOpen,
  onClose,
}: UsuarioFlyoutDrawerProps) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("••••••••••••");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setEmail(usuario.email);
      setPassword(usuario.passwordEnmascarada || "••••••••••••");
      setMostrarPassword(false);
    }
  }, [usuario]);

  // Cerrar al presionar tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !usuario) return null;

  return (
    <>
      {/* Backdrop oscuro semitransparente */}
      <div
        className="admin-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel lateral derecho (Flyout Drawer) */}
      <aside
        className="admin-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-user-title"
      >
        {/* Cabecera del Drawer */}
        <div className="admin-drawer-header">
          <div className="admin-drawer-title-box">
            <div className="admin-drawer-title-row">
              <h2 id="drawer-user-title" className="admin-drawer-title">
                Detalle de Usuario
              </h2>
              <span className="admin-drawer-badge">Vista Previa</span>
            </div>
            <p className="admin-drawer-subtitle">
              Consulta y gestión de credenciales del directorio UNTELS
            </p>
          </div>

          <button
            type="button"
            className="admin-drawer-close-btn"
            onClick={onClose}
            title="Cerrar panel lateral (Esc)"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del formulario con campos requeridos */}
        <div className="admin-drawer-body">
          {/* Campo: Nombre completo */}
          <div className="admin-form-group">
            <label htmlFor="user-fullname" className="admin-form-label">
              <span>Nombre completo</span>
              <span className="admin-form-required">*</span>
            </label>
            <input
              id="user-fullname"
              type="text"
              className="admin-form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa el nombre completo"
            />
          </div>

          {/* Campo: Email / Correo Electrónico */}
          <div className="admin-form-group">
            <label htmlFor="user-email" className="admin-form-label">
              <span>Correo electrónico (UPN)</span>
              <span className="admin-form-required">*</span>
            </label>
            <input
              id="user-email"
              type="email"
              className="admin-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@untels.edu.pe"
            />
          </div>

          {/* Campo: Contraseña y Botón Cambiar Contraseña no funcional */}
          <div className="admin-form-group admin-password-group">
            <label htmlFor="user-password" className="admin-form-label">
              <span>Contraseña</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="user-password"
                type={mostrarPassword ? "text" : "password"}
                className="admin-form-input"
                value={password}
                readOnly
                aria-label="Contraseña"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#616161",
                  fontSize: "0.8rem",
                }}
                title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarPassword ? "Ocultar" : "Ver"}
              </button>
            </div>

            {/* Botón no funcional solicitado por el usuario */}
            <button
              type="button"
              className="admin-btn-change-password-disabled"
              disabled
              title="Opción no funcional: función deshabilitada en esta vista visual hasta conectar el endpoint de autenticación."
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Cambiar contraseña (No funcional)</span>
            </button>
          </div>

          {/* Información complementaria de rol y estado */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              padding: "12px",
              background: "#faf9f8",
              border: "1px solid #edebe9",
              borderRadius: "4px",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "#616161" }}>Rol Asignado</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#242424" }}>
                {usuario.rolEtiqueta}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#616161" }}>Estado</div>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: usuario.habilitado ? "#107c10" : "#616161",
                }}
              >
                {usuario.habilitado ? "Habilitado" : "Inactivo"}
              </div>
            </div>
          </div>

          {/* Alerta de solo demostración visual similar al panel de Clone VM */}
          <div className="admin-drawer-warning-box">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: "2px" }}
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              Esta interfaz es exclusivamente visual. Las modificaciones realizadas no
              se persistirán en la base de datos hasta que se integre el endpoint oficial
              de administración.
            </div>
          </div>
        </div>

        {/* Footer de Acciones del Drawer */}
        <div className="admin-drawer-footer">
          <button
            type="button"
            className="admin-btn-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn-save"
            onClick={onClose}
          >
            Guardar cambios
          </button>
        </div>
      </aside>
    </>
  );
}

