/**
 * Tipos y contratos para la generación y gestión de tokens de usuario.
 */

export interface UserTokenPayload {
  sub: string;             // ID del usuario
  email: string;
  nombre: string;
  roles: string[];         // Códigos de roles: ['SOLICITANTE'] o ['PRESIDENTE_CEI', ...]
  homeView: 'inicio' | 'homeview2'; // Vista por defecto según su rol
  iat?: number;
  exp?: number;
}

export interface UserTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  homeView: 'inicio' | 'homeview2';
  user: {
    id: string;
    email: string;
    nombre: string;
    roles: string[];
  };
}
