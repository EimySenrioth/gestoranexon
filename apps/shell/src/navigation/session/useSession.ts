// ⏳ PENDIENTE: hook useSession para acceder a la sesión activa en componentes cliente
import { initialSessionState } from "./session.store";

export function useSession() {
  return {
    session: initialSessionState,
    isAuthenticated: false,
    login: async () => {
      // ⏳ PENDIENTE BACKEND
    },
    logout: () => {
      // ⏳ PENDIENTE BACKEND
    },
  };
}
