-- =====================================================================
-- SEED: 1 Usuario de prueba por cada rol del CEI (PostgreSQL)
-- Contraseña por defecto: Estancia2026!# (hash bcrypt)
-- =====================================================================

BEGIN;

-- 1. Insertar Catálogo de Roles si no existen
INSERT INTO rol (rol_id, nombre) VALUES
  (1, 'Solicitante / Investigador'),
  (2, 'Evaluador'),
  (3, 'Presidente del CEI'),
  (4, 'Vicepresidente del CEI'),
  (5, 'Secretaría Técnica del CEI'),
  (6, 'Secretaría Administrativa del CEI'),
  (7, 'Vocal del CEI'),
  (8, 'Administrador')
ON CONFLICT (rol_id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- 2. Insertar Usuarios
-- Nota: adaptado al esquema de usuario
INSERT INTO usuario (usuario_id, nombre, activo) VALUES
  (101, 'Dr. Carlos Mendoza (Solicitante)', true),
  (102, 'Dra. Elena Paredes (Evaluador)', true),
  (103, 'Dr. Ricardo Palma (Presidente CEI)', true),
  (104, 'Dra. Rosa Alva (Vicepresidente CEI)', true),
  (105, 'Mg. Andrés Salazar (Sec. Técnica CEI)', true),
  (106, 'Lic. Patricia Vega (Sec. Administrativa CEI)', true),
  (107, 'Dr. Manuel Quispe (Vocal CEI)', true),
  (108, 'Administrador del Sistema', true)
ON CONFLICT (usuario_id) DO NOTHING;

-- 3. Vincular Usuarios con sus Roles correspondientes en usuario_rol
INSERT INTO usuario_rol (usuario_id, rol_id) VALUES
  (101, 1), -- Solicitante
  (102, 2), -- Evaluador
  (103, 3), -- Presidente del CEI
  (104, 4), -- Vicepresidente del CEI
  (105, 5), -- Secretaría Técnica
  (106, 6), -- Secretaría Administrativa
  (107, 7), -- Vocal del CEI
  (108, 8)  -- Administrador
ON CONFLICT DO NOTHING;

COMMIT;
