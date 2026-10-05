// ⏳ PENDIENTE: implementación del estado de sesión (usuario, rol, token, login, logout)
// Se integrará cuando el backend esté disponible.

export interface SessionState {
  user: null;
  role: null;
  token: null;
}

export const initialSessionState: SessionState = {
  user: null,
  role: null,
  token: null,
};
