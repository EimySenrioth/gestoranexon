"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginWithApi } from "../services/auth.service";
import { saveStoredSession } from "@/navigation/session/session.store";
import type { Role } from "@/navigation/registry/types";

interface UseLoginOptions {
  onSuccess?: () => void;
}

export function useLogin({ onSuccess }: UseLoginOptions = {}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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

        onSuccess?.();

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
    },
    [email, password, router, onSuccess]
  );

  const handleForgotPassword = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    alert(
      "Para restablecer su contraseña, contacte a la Secretaría Administrativa del CEI (cei@untels.edu.pe)."
    );
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    handleSubmit,
    handleForgotPassword,
  };
}
