import { Client } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://estancia_user:estancia_pass@localhost:5432/estanciaperu_db?schema=public';

const client = new Client({ connectionString });

const roles = [
  { id: 1, codigo: 'SOLICITANTE', nombre: 'Solicitante / Investigador', descripcion: 'Usuario investigador o solicitante' },
  { id: 2, codigo: 'EVALUADOR', nombre: 'Evaluador de Proyectos', descripcion: 'Miembro evaluador del CEI' },
  { id: 3, codigo: 'PRESIDENTE_CEI', nombre: 'Presidente del CEI', descripcion: 'Presidente del Comité de Ética' },
  { id: 4, codigo: 'VICEPRESIDENTE_CEI', nombre: 'Vicepresidente del CEI', descripcion: 'Vicepresidente del Comité de Ética' },
  { id: 5, codigo: 'SECRETARIA_TECNICA_CEI', nombre: 'Secretaria Técnica del CEI', descripcion: 'Secretario Técnico del CEI' },
  { id: 6, codigo: 'SECRETARIA_ADMINISTRATIVA_CEI', nombre: 'Secretaria Administrativa del CEI', descripcion: 'Secretario Administrativo del CEI' },
  { id: 7, codigo: 'VOCAL_CEI', nombre: 'Vocal del CEI', descripcion: 'Vocal del Comité de Ética' },
  { id: 8, codigo: 'ADMINISTRADOR', nombre: 'Administrador', descripcion: 'Administrador del sistema' },
];

const users = [
  // Solicitante Oficial
  {
    id: 'usr_solicitante_1',
    email: 'solicitante@estanciaperu.gob.pe',
    nombre: 'Carlos',
    apellido: 'Mendoza Rivera',
    password: '',
    rolId: 1,
  },

  // 5 Evaluadores Oficiales del CEI
  {
    id: 'usr_presidente_1',
    email: 'presidente.cei@estanciaperu.gob.pe',
    nombre: 'Dr. Ricardo',
    apellido: 'Palma Benavides',
    password: 'Estancia2026!#',
    rolId: 3,
  },
  {
    id: 'usr_vicepresidente_1',
    email: 'vicepresidente.cei@estanciaperu.gob.pe',
    nombre: 'Dra. Rosa',
    apellido: 'Alva Montoya',
    password: 'Estancia2026!#',
    rolId: 4,
  },
  {
    id: 'usr_secretaria_tec_1',
    email: 'secretaria.tecnica@estanciaperu.gob.pe',
    nombre: 'Mg. Andrés',
    apellido: 'Salazar Córdova',
    password: 'Estancia2026!#',
    rolId: 5,
  },
  {
    id: 'usr_secretaria_adm_1',
    email: 'secretaria.admin@estanciaperu.gob.pe',
    nombre: 'Lic. Patricia',
    apellido: 'Vega Zeballos',
    password: 'Estancia2026!#',
    rolId: 6,
  },
  {
    id: 'usr_vocal_1',
    email: 'vocal.cei@estanciaperu.gob.pe',
    nombre: 'Dr. Manuel',
    apellido: 'Quispe Huamán',
    password: 'Estancia2026!#',
    rolId: 7,
  },

  // Administrador Oficial
  {
    id: 'usr_admin_2',
    email: 'admin@estancia.pe',
    nombre: 'Administrador',
    apellido: 'Sistema',
    password: '',
    rolId: 8,
  },
];

async function runSeed() {
  await client.connect();
  console.log('Conectado a PostgreSQL.');

  for (const r of roles) {
    await client.query(
      `INSERT INTO roles (id, codigo, nombre, descripcion)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE
       SET codigo = EXCLUDED.codigo, nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion`,
      [r.id, r.codigo, r.nombre, r.descripcion]
    );
  }
  console.log('Roles verificados e insertados.');

  for (const u of users) {
    await client.query(
      `INSERT INTO usuarios (id, email, password, nombre, apellido, activo, "actualizadoEn")
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       ON CONFLICT (email) DO UPDATE
       SET nombre = EXCLUDED.nombre, apellido = EXCLUDED.apellido, activo = true`,
      [u.id, u.email, '', u.nombre, u.apellido]
    );

    const res = await client.query('SELECT id FROM usuarios WHERE email = $1', [u.email]);
    const userId = res.rows[0].id;

    await client.query(
      `INSERT INTO usuario_roles ("usuarioId", "rolId", "asignadoEn")
       VALUES ($1, $2, NOW())
       ON CONFLICT ("usuarioId", "rolId") DO NOTHING`,
      [userId, u.rolId]
    );
  }

  console.log('Usuarios y asignación de roles sembrados exitosamente.');
  await client.end();
}

runSeed().catch((err) => {
  console.error('Error al sembrar datos:', err);
  client.end();
  process.exit(1);
});
