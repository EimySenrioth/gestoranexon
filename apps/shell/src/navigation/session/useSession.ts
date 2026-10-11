"use client";

import { useState, useEffect, useCallback } from "react";
import {
  loadStoredSession,
  saveStoredSession,
  clearStoredSession,
  initialSessionState,
  type SessionState,
} from "./session.store";

export function useSession() {
  const [session, setSession] = useState<SessionState>(initialSessionState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setSession(loadStoredSession());
    setIsReady(true);
  }, []);

  const loginSession = useCallback((newSession: SessionState) => {
    setSession(newSession);
    saveStoredSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    try {
      const { logoutWithApi } = await import("@/features/auth/services/auth.service");
      await logoutWithApi();
    } catch (e) {
      console.warn("Aviso al contactar servicio de logout:", e);
    } finally {
      clearStoredSession();
      setSession(initialSessionState);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }, []);

  return {
    session,
    isReady,
    isAuthenticated: Boolean(session.token && session.user),
    user: session.user,
    roles: session.roles,
    homeView: session.homeView,
    loginSession,
    logout,
  };
}
