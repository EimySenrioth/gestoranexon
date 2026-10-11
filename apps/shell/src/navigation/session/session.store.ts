import type { Role } from "../registry/types";

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  roles: Role[];
}

export interface SessionState {
  user: SessionUser | null;
  roles: Role[];
  token: string | null;
  homeView: "inicio" | "homeview2" | null;
}

export const initialSessionState: SessionState = {
  user: null,
  roles: [],
  token: null,
  homeView: null,
};

const STORAGE_KEY = "estanciaperu_session";

export function loadStoredSession(): SessionState {
  if (typeof window === "undefined") {
    return initialSessionState;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialSessionState;
    return JSON.parse(raw) as SessionState;
  } catch {
    return initialSessionState;
  }
}

export function saveStoredSession(session: SessionState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error("Error guardando sesión en storage:", err);
  }
}

export function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Error limpiando sesión en storage:", err);
  }
}
