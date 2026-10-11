"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TextField, PillButton } from "@/components/ui";
import { loginWithApi } from "../../services/auth.service";
import { saveStoredSession } from "@/navigation/session/session.store";
import type { Role } from "@/navigation/registry/types";

export function CredentialsStep() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor ingrese su correo institucional.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await loginWithApi({ email, password });

      // Guardar estado de sesión en almacenamiento local
      saveStoredSession({
        user: {
          id: response.user.id,
          email: response.user.email,
          nombre: response.user.nombre ?? "",
          roles: response.user.roles as Role[],
        },
        roles: response.user.roles as Role[],
        token: response.accessToken,
        homeView: response.homeView,
      });

      // Redirigir según la directiva homeView devuelta por el backend:
      // - 'inicio' (Vista 1 para Solicitante)
      // - 'homeview2' (Vista 2 para Comité CEI, Evaluadores y Administrador)
      router.push(`/${response.homeView}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("Para restablecer su contraseña, contacte a la Secretaría Administrativa del CEI (cei@untels.edu.pe).");
  };

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
