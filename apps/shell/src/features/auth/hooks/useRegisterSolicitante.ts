"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { registrarSolicitanteApi } from "../services/newusers.service";
import { loginWithApi } from "../services/auth.service";
import { saveStoredSession } from "@/navigation/session/session.store";
import type { Role } from "@/navigation/registry/types";

export const REGISTRO_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

interface UseRegisterSolicitanteOptions {
  onSuccess?: () => void;
}

export function useRegisterSolicitante({
  onSuccess,
}: UseRegisterSolicitanteOptions = {}) {
  const router = useRouter();
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [passwordInvalida, setPasswordInvalida] = useState(false);
  const [confirmacionInvalida, setConfirmacionInvalida] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordChange = useCallback(
    (valor: string) => {
      setPassword(valor);
      if (passwordInvalida && REGISTRO_PASSWORD_REGEX.test(valor.trim())) {
        setPasswordInvalida(false);
      }
    },
    [passwordInvalida]
  );

  const handleConfirmarPasswordChange = useCallback(
    (valor: string) => {
      setConfirmarPassword(valor);
      if (confirmacionInvalida && valor.trim() === password.trim()) {
        setConfirmacionInvalida(false);
      }
    },
    [confirmacionInvalida, password]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const nombreLimpio = nombreCompleto.trim();
      const emailLimpio = email.trim().toLowerCase();
      const passLimpia = password.trim();
      const confirmarLimpia = confirmarPassword.trim();

      if (!nombreLimpio || !emailLimpio) {
        setError("El nombre completo y el correo electrónico son obligatorios.");
        return;
      }

      if (!REGISTRO_PASSWORD_REGEX.test(passLimpia)) {
        setPasswordInvalida(true);
        setError(null);
        return;
      }
      setPasswordInvalida(false);

      if (passLimpia !== confirmarLimpia) {
        setConfirmacionInvalida(true);
        setError(null);
        return;
      }
      setConfirmacionInvalida(false);

      setLoading(true);
      setError(null);

      try {
        // 1. Crear el nuevo usuario con rol fijo SOLICITANTE (rolId = 1)
        await registrarSolicitanteApi({
          nombre: nombreLimpio,
          email: emailLimpio,
          password: passLimpia,
          confirmarPassword: confirmarLimpia,
        });

        // 2. Reutilizar el endpoint de login (/api/auth/login -> POST /api/v1/users/login)
        const loginRes = await loginWithApi({
          email: emailLimpio,
          password: passLimpia,
        });

        saveStoredSession({
          user: {
            id: loginRes.user.id,
            email: loginRes.user.email,
            nombre: loginRes.user.nombre ?? nombreLimpio,
            roles: loginRes.user.roles as Role[],
          },
          roles: loginRes.user.roles as Role[],
          token: loginRes.accessToken,
          homeView: loginRes.homeView,
        });

        onSuccess?.();
        router.push(`/${loginRes.homeView}`);
      } catch (err: any) {
        setError(
          err?.message || "No se pudo completar el registro de la cuenta."
        );
      } finally {
        setLoading(false);
      }
    },
    [nombreCompleto, email, password, confirmarPassword, onSuccess, router]
  );

  return {
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
  };
}

