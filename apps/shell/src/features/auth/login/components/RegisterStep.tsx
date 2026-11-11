"use client";

import React from "react";
import { Tabs, TextField, PillButton } from "@/components/ui";
import { useRegisterSolicitante } from "../../hooks/useRegisterSolicitante";

interface RegisterStepProps {
  onSwitchToLogin: () => void;
}

export function RegisterStep({ onSwitchToLogin }: RegisterStepProps) {
  const {
    nombreCompleto,
    setNombreCompleto,
    email,
    setEmail,
    password,
    handlePasswordChange,
    confirmarPassword,
    handleConfirmarPasswordChange,
    mostrarPassword,
    setMostrarPassword,
    passwordInvalida,
    confirmacionInvalida,
    loading,
    error,
    handleSubmit,
  } = useRegisterSolicitante();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full relative">
      {/* Selector de pestañas: Iniciar sesión / ¿eres nuevo? */}
      <Tabs
        activeId="register"
        onTabChange={(tabId) => {
          if (tabId === "login") {
            onSwitchToLogin();
          }
        }}
      />

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-300"
        >
          {error}
        </div>
      )}

      {/* Campo: Nombre Completo */}
      <TextField
        id="register-fullname"
        label="Nombre completo"
        type="text"
        value={nombreCompleto}
        onChange={(e) => setNombreCompleto(e.target.value)}
        placeholder="Ingresa tus nombres y apellidos"
        required
      />

      {/* Campo: Correo Electrónico */}
      <TextField
        id="register-email"
        label="Correo Electrónico"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="ejemplo@untels.edu.pe"
        required
      />

      {/* Campo: Contraseña con botón Ver/Ocultar */}
      <div className="ui-text-field">
        <label htmlFor="register-password" className="ui-text-field__label">
          Contraseña
        </label>
        <div style={{ position: "relative" }}>
          <input
            id="register-password"
            type={mostrarPassword ? "text" : "password"}
            className="ui-text-field__input"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Mín. 8 caracteres (A-z, 0-9 y signos)"
            style={{
              paddingRight: "86px",
              borderColor: passwordInvalida ? "#d13438" : undefined,
              color: passwordInvalida ? "#a80000" : undefined,
            }}
            required
          />
          <button
            type="button"
            onClick={() => setMostrarPassword((prev) => !prev)}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#242424",
              fontSize: "0.85rem",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
            title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
          >
            {mostrarPassword ? "Ocultar" : "Ver"}
          </button>
        </div>
        <span
          style={{
            fontSize: "0.78rem",
            color: passwordInvalida ? "#d13438" : "#616161",
            fontWeight: passwordInvalida ? 600 : 400,
            transition: "color 0.15s ease",
          }}
        >
          Debe incluir mínimo 8 caracteres con mayúsculas, minúsculas, números y
          signos.
        </span>
      </div>

      {/* Campo: Confirmar Contraseña */}
      <div className="ui-text-field">
        <label
          htmlFor="register-confirm-password"
          className="ui-text-field__label"
        >
          Confirmar contraseña
        </label>
        <input
          id="register-confirm-password"
          type={mostrarPassword ? "text" : "password"}
          className="ui-text-field__input"
          value={confirmarPassword}
          onChange={(e) => handleConfirmarPasswordChange(e.target.value)}
          placeholder="Repite tu contraseña"
          style={{
            borderColor: confirmacionInvalida ? "#d13438" : undefined,
            color: confirmacionInvalida ? "#a80000" : undefined,
          }}
          required
        />
        {confirmacionInvalida && (
          <span
            style={{
              fontSize: "0.78rem",
              color: "#d13438",
              fontWeight: 600,
            }}
          >
            La confirmación no coincide con la contraseña ingresada.
          </span>
        )}
      </div>

      <PillButton type="submit" disabled={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </PillButton>
    </form>
  );
}

