import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EvaluationSessionService {
  private readonly _token = signal<string | null>(null);
  private readonly _expedienteId = signal<string | null>(null);
  private readonly _soloLectura = signal<boolean>(false);

  readonly token = this._token.asReadonly();
  readonly expedienteId = this._expedienteId.asReadonly();
  readonly soloLectura = this._soloLectura.asReadonly();

  constructor() {
    this.inicializarDesdeUrlOSession();
  }

  private inicializarDesdeUrlOSession(): void {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const expedienteIdParam = urlParams.get('expedienteId') || urlParams.get('id');

    if (tokenParam) {
      this._token.set(tokenParam);
      sessionStorage.setItem('evaluation_token', tokenParam);
    } else {
      const stored = sessionStorage.getItem('evaluation_token');
      if (stored) this._token.set(stored);
    }

    if (expedienteIdParam) {
      this._expedienteId.set(expedienteIdParam);
      sessionStorage.setItem('evaluation_expediente_id', expedienteIdParam);
    } else {
      const storedId = sessionStorage.getItem('evaluation_expediente_id');
      if (storedId) {
        this._expedienteId.set(storedId);
      }
    }

    // Si aún no tenemos expedienteId pero sí hay token, extraerlo del payload del JWT
    if (!this._expedienteId() && this._token()) {
      try {
        const parts = this._token()!.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.expedienteId) {
            this._expedienteId.set(payload.expedienteId);
            sessionStorage.setItem('evaluation_expediente_id', payload.expedienteId);
          }
        }
      } catch (e) {
        console.warn('[EvaluationSessionService] Error al decodificar token:', e);
      }
    }
  }

  setToken(token: string): void {
    this._token.set(token);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('evaluation_token', token);
    }
  }

  setExpedienteId(id: string): void {
    this._expedienteId.set(id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('evaluation_expediente_id', id);
    }
  }

  setSoloLectura(soloLectura: boolean): void {
    this._soloLectura.set(soloLectura);
  }

  limpiarSesion(): void {
    this._token.set(null);
    this._expedienteId.set(null);
    this._soloLectura.set(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('evaluation_token');
      sessionStorage.removeItem('evaluation_expediente_id');
    }
  }
}
