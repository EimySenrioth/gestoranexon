"use client";

import React, { useEffect, useState } from "react";
import {
  RolDisponibleItem,
  UsuarioItem,
} from "../types/usuarios.types";
import {
  actualizarUsuarioAdmin,
  cambiarPasswordUsuarioAdmin,
  crearUsuarioAdmin,
} from "../services/admin-usuarios.service";

interface UsuarioFlyoutDrawerProps {
  usuario: UsuarioItem | null;
  rolesDisponibles?: RolDisponibleItem[];
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (usuarioGuardado: UsuarioItem) => void;
}

const PASSWORD_COMPLEJA_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

const ROLES_CREACION_FALLBACK: RolDisponibleItem[] = [
  {
    id: 1,
    codigo: "SOLICITANTE",
    nombre: "Solicitante / Investigador",
    descripcion: "Usuario investigador o solicitante",
    categoria: "SOLICITANTE",
  },
  {
    id: 8,
    codigo: "ADMINISTRADOR",
    nombre: "Administrador",
    descripcion: "Administrador del sistema",
    categoria: "ADMINISTRADOR",
  },
];

export function UsuarioFlyoutDrawer({
  usuario,
  rolesDisponibles = [],
  isOpen,
  onClose,
  onSaved,
}: UsuarioFlyoutDrawerProps) {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("••••••••••••");
  const [rolId, setRolId] = useState<number>(1);
  const [habilitado, setHabilitado] = useState<boolean>(true);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [editandoPassword, setEditandoPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState(false);
  const [passwordInvalida, setPasswordInvalida] = useState(false);
  const [confirmacionInvalida, setConfirmacionInvalida] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const esNuevo = Boolean(usuario?.id?.startsWith("usr-new-"));

  useEffect(() => {
    if (usuario) {
      setNombreCompleto(usuario.nombreCompleto || usuario.nombre || "");
      setEmail(usuario.email || "");
      setPassword(
        esNuevo
          ? ""
          : usuario.passwordEnmascarada &&
              !usuario.passwordEnmascarada.includes("••")
            ? usuario.passwordEnmascarada
            : "Estancia2026!#"
      );
      // En creación solo se permite Solicitante (1) o Administrador (8)
      setRolId(
        esNuevo
          ? usuario.rolId === 8
            ? 8
            : 1
          : usuario.rolId || (usuario.categoria === "EVALUADOR" ? 3 : 1)
      );
      setHabilitado(usuario.habilitado ?? true);
      setMostrarPassword(false);
      setEditandoPassword(false);
      setNuevaPassword("");
      setConfirmarPassword("");
      setMostrarNuevaPassword(false);
      setPasswordInvalida(false);
      setConfirmacionInvalida(false);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [usuario, esNuevo]);

  // Cerrar al presionar tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSaving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen || !usuario) return null;

  // Para creación: exclusivamente Solicitante (1) y Administrador (8)
  const rolesCreacion = rolesDisponibles.filter(
    (r) => r.id === 1 || r.id === 8 || r.codigo === "SOLICITANTE" || r.codigo === "ADMINISTRADOR"
  );
  const opcionesRolNuevo =
    rolesCreacion.length > 0 ? rolesCreacion : ROLES_CREACION_FALLBACK;

  const handleCambiarPasswordDirecto = async () => {
    const nuevaLimpia = nuevaPassword.trim();
    const confirmarLimpia = confirmarPassword.trim();

    if (!PASSWORD_COMPLEJA_REGEX.test(nuevaLimpia)) {
      setPasswordInvalida(true);
      setErrorMsg(null);
      return;
    }
    setPasswordInvalida(false);

    if (nuevaLimpia !== confirmarLimpia) {
      setConfirmacionInvalida(true);
      setErrorMsg(null);
      return;
    }
    setConfirmacionInvalida(false);

    setIsUpdatingPassword(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const actualizado = await cambiarPasswordUsuarioAdmin(usuario.id, {
        nuevaPassword: nuevaLimpia,
        confirmarPassword: confirmarLimpia,
      });
      setPassword(actualizado.passwordEnmascarada || nuevaLimpia);
      setEditandoPassword(false);
      setNuevaPassword("");
      setConfirmarPassword("");
      setPasswordInvalida(false);
      setConfirmacionInvalida(false);
      setSuccessMsg("Contraseña actualizada correctamente en la base de datos.");
      onSaved?.(actualizado);
    } catch (err: any) {
      setPasswordInvalida(true);
      setErrorMsg(
        err?.message || "No se pudo actualizar la contraseña del usuario."
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSave = async () => {
    const nombreLimpio = nombreCompleto.trim();
    const emailLimpio = email.trim().toLowerCase();

    if (!nombreLimpio || !emailLimpio) {
      setErrorMsg("El nombre completo y el correo electrónico son obligatorios.");
      return;
    }

    if (esNuevo && rolId !== 1 && rolId !== 8) {
      setErrorMsg(
        "Solo se permite registrar usuarios con el rol de Solicitante o Administrador."
      );
      return;
    }

    if (esNuevo && password.trim().length > 0 && !password.includes("••")) {
      if (!PASSWORD_COMPLEJA_REGEX.test(password.trim())) {
        setPasswordInvalida(true);
        setErrorMsg(null);
        return;
      }
      setPasswordInvalida(false);
    }

    // Si estaba abierto el formulario de cambio de contraseña con texto ingresado, validarlo también
    const nuevaPassTrim = nuevaPassword.trim();
    if (!esNuevo && editandoPassword && nuevaPassTrim.length > 0) {
      if (!PASSWORD_COMPLEJA_REGEX.test(nuevaPassTrim)) {
        setPasswordInvalida(true);
        setErrorMsg(null);
        return;
      }
      setPasswordInvalida(false);
      if (nuevaPassTrim !== confirmarPassword.trim()) {
        setConfirmacionInvalida(true);
        setErrorMsg(null);
        return;
      }
      setConfirmacionInvalida(false);
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let resultado: UsuarioItem;
      if (esNuevo) {
        resultado = await crearUsuarioAdmin({
          nombre: nombreLimpio,
          email: emailLimpio,
          password:
            password && !password.includes("••") && password.trim().length > 0
              ? password.trim()
              : "Estancia2026!#",
          rolId,
          activo: habilitado,
        });
      } else {
        if (editandoPassword && PASSWORD_COMPLEJA_REGEX.test(nuevaPassTrim)) {
          await cambiarPasswordUsuarioAdmin(usuario.id, {
            nuevaPassword: nuevaPassTrim,
            confirmarPassword: confirmarPassword.trim(),
          });
        }
        resultado = await actualizarUsuarioAdmin(usuario.id, {
          nombre: nombreLimpio,
          email: emailLimpio,
          activo: habilitado,
        });
      }

      onSaved?.(resultado);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err?.message || "No se pudieron guardar los cambios del usuario."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop oscuro semitransparente */}
      <div
        className="admin-drawer-backdrop"
        onClick={() => !isSaving && onClose()}
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
                {esNuevo ? "Nuevo Usuario" : "Detalle de Usuario"}
              </h2>
              <span className="admin-drawer-badge">
                {esNuevo ? "Registro" : "Directorio"}
              </span>
            </div>
            <p className="admin-drawer-subtitle">
              Consulta y gestión de credenciales del directorio UNTELS
            </p>
          </div>

          <button
            type="button"
            className="admin-drawer-close-btn"
            onClick={onClose}
            disabled={isSaving}
            title="Cerrar panel lateral (Esc)"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Cuerpo del formulario con campos requeridos */}
        <div className="admin-drawer-body">
          {errorMsg && (
            <div
              style={{
                padding: "10px 12px",
                background: "#fde7e9",
                border: "1px solid #d13438",
                borderRadius: "4px",
                color: "#a80000",
                fontSize: "0.82rem",
              }}
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              style={{
                padding: "10px 12px",
                background: "#dff6dd",
                border: "1px solid #107c10",
                borderRadius: "4px",
                color: "#0b5a0b",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              {successMsg}
            </div>
          )}

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
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ingresa el nombre y apellidos"
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

          {/* Campo: Rol Institucional y Estado */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div className="admin-form-group">
              <label htmlFor="user-role" className="admin-form-label">
                <span>Rol Asignado</span>
                {esNuevo && <span className="admin-form-required">*</span>}
              </label>
              {esNuevo ? (
                <select
                  id="user-role"
                  className="admin-form-input"
                  value={rolId}
                  onChange={(e) => setRolId(Number(e.target.value))}
                >
                  {opcionesRolNuevo.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  style={{
                    padding: "8px 10px",
                    background: "#faf9f8",
                    border: "1px solid #edebe9",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#242424",
                  }}
                  title="El rol institucional asignado es fijo"
                >
                  {usuario.rolEtiqueta}
                </div>
              )}
            </div>

            <div className="admin-form-group">
              <label htmlFor="user-status" className="admin-form-label">
                <span>Estado de Cuenta</span>
              </label>
              <select
                id="user-status"
                className="admin-form-input"
                value={habilitado ? "ACTIVO" : "INACTIVO"}
                onChange={(e) => setHabilitado(e.target.value === "ACTIVO")}
              >
                <option value="ACTIVO">Habilitado</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
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
                readOnly={!esNuevo}
                onChange={(e) => {
                  if (!esNuevo) return;
                  const val = e.target.value;
                  setPassword(val);
                  if (
                    passwordInvalida &&
                    (val.trim().length === 0 ||
                      PASSWORD_COMPLEJA_REGEX.test(val.trim()))
                  ) {
                    setPasswordInvalida(false);
                    setErrorMsg(null);
                  }
                }}
                placeholder={
                  esNuevo
                    ? "Mín. 8 caracteres (A-z, 0-9 y signos)"
                    : "••••••••••••"
                }
                aria-label="Contraseña"
                style={{
                  paddingRight: "84px",
                  borderColor:
                    esNuevo && passwordInvalida ? "#d13438" : undefined,
                  color: esNuevo && passwordInvalida ? "#a80000" : undefined,
                }}
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
                  color: "#0078d4",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 6px",
                }}
                title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                aria-label={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {mostrarPassword ? (
                  <>
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
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                    <span>Ocultar</span>
                  </>
                ) : (
                  <>
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>Ver</span>
                  </>
                )}
              </button>
            </div>
            {esNuevo && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: passwordInvalida ? "#d13438" : "#616161",
                  fontWeight: passwordInvalida ? 600 : 400,
                  transition: "color 0.15s ease",
                }}
              >
                Debe incluir mínimo 8 caracteres con mayúsculas, minúsculas,
                números y signos.
              </span>
            )}

            {!esNuevo && (
              <button
                type="button"
                className="admin-action-btn"
                onClick={() => {
                  setEditandoPassword((prev) => !prev);
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                style={{
                  justifyContent: "center",
                  width: "100%",
                  borderColor: editandoPassword ? "#0078d4" : "#8a8886",
                  color: editandoPassword ? "#0078d4" : "#242424",
                  fontWeight: 600,
                }}
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
                <span>
                  {editandoPassword
                    ? "Ocultar cambio de contraseña"
                    : "Cambiar contraseña"}
                </span>
              </button>
            )}
          </div>

          {/* Nota informativa debajo del formulario sobre la restricción de los 5 roles fijos del CEI */}
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
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <strong>Nota sobre roles del Comité:</strong> El registro de nuevos
              usuarios está restringido únicamente a cuentas de{" "}
              <strong>Solicitante / Investigador</strong> y{" "}
              <strong>Administrador</strong>. Los 5 cargos del Comité de Ética
              para la Investigación (Presidente, Vicepresidente, Secretaría
              Técnica, Secretaría Administrativa y Vocal) son plazas
              institucionales fijas; para actualizar al titular de un cargo del
              CEI, seleccione su fila existente en la tabla y edite sus datos.
            </div>
          </div>
        </div>

        {/* Footer de Acciones del Drawer */}
        <div className="admin-drawer-footer">
          <button
            type="button"
            className="admin-btn-cancel"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="admin-btn-save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </aside>

      {/* Panel flotante hacia la izquierda (dirección a la barra de navegación) para Cambiar Contraseña */}
      {!esNuevo && editandoPassword && (
        <div
          className="admin-password-flyout-left"
          role="region"
          aria-label="Cambiar contraseña"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #edebe9",
              paddingBottom: "8px",
            }}
          >
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#242424",
              }}
            >
              Cambiar contraseña
            </span>
            <button
              type="button"
              onClick={() => {
                setEditandoPassword(false);
                setNuevaPassword("");
                setConfirmarPassword("");
                setPasswordInvalida(false);
                setConfirmacionInvalida(false);
                setErrorMsg(null);
              }}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#616161",
                fontSize: "0.95rem",
                padding: "2px 6px",
              }}
              title="Cerrar cambio de contraseña"
              aria-label="Cerrar cambio de contraseña"
            >
              ✕
            </button>
          </div>

          <div className="admin-form-group">
            <label htmlFor="user-new-password" className="admin-form-label">
              <span>Nueva contraseña</span>
              <span className="admin-form-required">*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="user-new-password"
                type={mostrarNuevaPassword ? "text" : "password"}
                className="admin-form-input"
                value={nuevaPassword}
                onChange={(e) => {
                  const val = e.target.value;
                  setNuevaPassword(val);
                  if (
                    passwordInvalida &&
                    PASSWORD_COMPLEJA_REGEX.test(val.trim())
                  ) {
                    setPasswordInvalida(false);
                    setErrorMsg(null);
                  }
                }}
                placeholder="Mín. 8 caracteres (A-z, 0-9 y signos)"
                style={{
                  paddingRight: "80px",
                  borderColor: passwordInvalida ? "#d13438" : undefined,
                  color: passwordInvalida ? "#a80000" : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setMostrarNuevaPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#0078d4",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                {mostrarNuevaPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                color: passwordInvalida ? "#d13438" : "#616161",
                fontWeight: passwordInvalida ? 600 : 400,
                transition: "color 0.15s ease",
              }}
            >
              Debe incluir mínimo 8 caracteres con mayúsculas, minúsculas,
              números y signos.
            </span>
          </div>

          <div className="admin-form-group">
            <label
              htmlFor="user-confirm-password"
              className="admin-form-label"
            >
              <span>Confirmar nueva contraseña</span>
              <span className="admin-form-required">*</span>
            </label>
            <input
              id="user-confirm-password"
              type={mostrarNuevaPassword ? "text" : "password"}
              className="admin-form-input"
              value={confirmarPassword}
              onChange={(e) => {
                const val = e.target.value;
                setConfirmarPassword(val);
                if (
                  confirmacionInvalida &&
                  val.trim() === nuevaPassword.trim()
                ) {
                  setConfirmacionInvalida(false);
                  setErrorMsg(null);
                }
              }}
              placeholder="Repite la nueva contraseña"
              style={{
                borderColor: confirmacionInvalida ? "#d13438" : undefined,
                color: confirmacionInvalida ? "#a80000" : undefined,
              }}
            />
            {confirmacionInvalida && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#d13438",
                  fontWeight: 600,
                }}
              >
                La confirmación no coincide con la nueva contraseña.
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "2px",
            }}
          >
            <button
              type="button"
              className="admin-btn-cancel"
              onClick={() => {
                setEditandoPassword(false);
                setNuevaPassword("");
                setConfirmarPassword("");
                setPasswordInvalida(false);
                setConfirmacionInvalida(false);
                setErrorMsg(null);
              }}
              disabled={isUpdatingPassword}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="admin-btn-save"
              onClick={handleCambiarPasswordDirecto}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
