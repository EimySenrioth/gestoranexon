import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:1234@localhost:5432/estanciaperu_db?schema=public',
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL.');
    await client.query(`
      ALTER TABLE "evaluaciones" 
      ADD COLUMN IF NOT EXISTS "metodologiaRiesgos" TEXT;
    `);
    console.log('Column metodologiaRiesgos added or verified.');
    
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "evaluaciones_expedienteId_evaluadorId_key" 
      ON "evaluaciones"("expedienteId", "evaluadorId");
    `);
    console.log('Unique index evaluaciones_expedienteId_evaluadorId_key created or verified.');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
