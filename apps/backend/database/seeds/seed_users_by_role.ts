/**
 * Script de Siembra (Seed) de Usuarios Iniciales por Rol para el CEI
 * Crea 1 usuario de prueba con contraseña hasheada y asignación de rol en BD para cada rol institucional.
 */

export interface SeedUser {
  email: string;
  nombre: string;
  apellido: string;
  rolId: number;
  rolCodigo: string;
  cargo: string;
  // Contraseña en texto plano para desarrollo: 'Estancia2026!#'
  // Hash bcrypt generado con 10 rounds:
  passwordHash: string;
}

export const USERS_BY_ROLE_SEED: SeedUser[] = [
  {
    email: 'solicitante@estanciaperu.gob.pe',
    nombre: 'Carlos',
    apellido: 'Mendoza Rivera',
    rolId: 1,
    rolCodigo: 'SOLICITANTE',
    cargo: 'Investigador Principal / Solicitante',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
  {
    email: 'evaluador@estanciaperu.gob.pe',
    nombre: 'Elena',
    apellido: 'Paredes Castro',
    rolId: 2,
    rolCodigo: 'EVALUADOR',
    cargo: 'Evaluador Externo / Revisor Temático',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
  {
    email: 'presidente.cei@estanciaperu.gob.pe',
    nombre: 'Ricardo',
    apellido: 'Palma Benavides',
    rolId: 3,
    rolCodigo: 'PRESIDENTE_CEI',
    cargo: 'Presidente del Comité de Ética (CEI)',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
  {
    email: 'vicepresidente.cei@estanciaperu.gob.pe',
    nombre: 'Rosa',
    apellido: 'Alva Montoya',
    rolId: 4,
    rolCodigo: 'VICEPRESIDENTE_CEI',
    cargo: 'Vicepresidente del Comité de Ética (CEI)',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
  {
    email: 'secretaria.tecnica@estanciaperu.gob.pe',
    nombre: 'Andrés',
    apellido: 'Salazar Córdova',
    rolId: 5,
    rolCodigo: 'SECRETARIA_TECNICA_CEI',
    cargo: 'Secretaría Técnica del CEI',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
  {
    email: 'secretaria.admin@estanciaperu.gob.pe',
    nombre: 'Patricia',
    apellido: 'Vega Zeballos',
    rolId: 6,
    rolCodigo: 'SECRETARIA_ADMINISTRATIVA_CEI',
    cargo: 'Secretaría Administrativa del CEI',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
  {
    email: 'vocal.cei@estanciaperu.gob.pe',
    nombre: 'Manuel',
    apellido: 'Quispe Huamán',
    rolId: 7,
    rolCodigo: 'VOCAL_CEI',
    cargo: 'Vocal Titular del CEI',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
  {
    email: 'admin@estanciaperu.gob.pe',
    nombre: 'Administrador',
    apellido: 'Principal',
    rolId: 8,
    rolCodigo: 'ADMINISTRADOR',
    cargo: 'Administrador General de la Plataforma',
    passwordHash: '$2b$10$wO3vR0K6l5aX8N3wQW6r7eE5n4K0f6F9q0V4u2o9n4y9x0p1q2r3s',
  },
];
