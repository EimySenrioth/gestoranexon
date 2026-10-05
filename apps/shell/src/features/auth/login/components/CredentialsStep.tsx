"use client";

import React, { useState } from "react";
import { TextField, PillButton } from "@/components/ui";

export function CredentialsStep() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ⏳ PENDIENTE: enviar credenciales al backend (POST /auth/login) y gestionar sesión
    console.info("[CredentialsStep] Submit pendiente de integración con el backend:", { email });
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    // ⏳ PENDIENTE: flujo de recuperación de contraseña
    console.info("[CredentialsStep] Recuperación de contraseña pendiente de backend.");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">

      {/* Campo: Correo Electrónico */}
      <TextField
        id="email"
        label="Correo Electrónico"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder=""
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

      {/* Botón: Iniciar sesion */}
      <PillButton type="submit">
        Iniciar sesion
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
