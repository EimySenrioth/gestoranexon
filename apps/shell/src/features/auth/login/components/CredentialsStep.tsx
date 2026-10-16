"use client";

import React from "react";
import { TextField, PillButton } from "@/components/ui";
import { useLogin } from "../../hooks/useLogin";

export function CredentialsStep() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
    handleForgotPassword,
  } = useLogin();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      {/* Mensaje de error si falla la autenticación */}
      {error && (
        <div
          role="alert"
          className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md border border-red-300"
        >
          {error}
        </div>
      )}

      {/* Campo: Correo Electrónico */}
      <TextField
        id="email"
        label="Correo Electrónico"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="ejemplo@estanciaperu.gob.pe"
        required
      />

      {/* Campo: Contraseña */}
      <TextField
        id="password"
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        placeholder=""
      />

      {/* Botón: Iniciar sesión */}
      <PillButton type="submit" disabled={loading}>
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </PillButton>

      {/* Divisor horizontal inferior */}
      <hr className="ui-credentials-divider" />

      {/* Enlace: ¿Olvidó su contraseña? */}
      <button
        type="button"
        onClick={handleForgotPassword}
        className="ui-forgot-password-link"
      >
        ¿Olvidó su contraseña?
      </button>
    </form>
  );
}
