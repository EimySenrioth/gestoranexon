import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { PrismaService } from '../database/prisma.service.js';
import { GenerarAnexo9PdfUseCase } from '../cei-documentos/use-cases/generar-anexo9-pdf.use-case.js';

async function runBackfill() {
  console.log('================================================================');
  console.log('🚀 INICIANDO SCRIPT DE BACKFILL MASIVO: ANEXO N°9 (CEI UNTELS)');
  console.log('================================================================');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const prisma = app.get(PrismaService);
  const generarPdfUseCase = app.get(GenerarAnexo9PdfUseCase);

  try {
    // Buscar expedientes candidatos con al menos 5 evaluaciones y sin anexo 9 emitido
    const expedientesCandidatos = await prisma.expediente.findMany({
      where: {
        anexo9DocumentoId: null,
        evaluaciones: {
          some: {},
        },
      },
      include: {
        evaluaciones: {
          select: { id: true },
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    const expedientesCompletos = expedientesCandidatos.filter(
      (e) => e.evaluaciones.length >= 5,
    );

    console.log(`📋 Total de expedientes candidatos encontrados: ${expedientesCompletos.length}`);

    if (expedientesCompletos.length === 0) {
      console.log('✨ No hay expedientes pendientes de generación de Anexo N°9.');
      return;
    }

    let exitosos = 0;
    let fallidos = 0;

    for (const exp of expedientesCompletos) {
      console.log(`\n⏳ Procesando expediente: ${exp.codigo} (${exp.id})...`);
      try {
        const resultado = await generarPdfUseCase.ejecutar(exp.id);
        console.log(`✅ [EXITO] PDF generado para ${exp.codigo}:`);
        console.log(`   - Archivo: ${resultado.documento.nombreArchivo}`);
        console.log(`   - SHA-256: ${resultado.documento.hashSha256}`);
        console.log(`   - Páginas: ${resultado.documento.totalPaginas}`);
        exitosos++;
      } catch (err: any) {
        console.error(`❌ [ERROR] Falló expediente ${exp.codigo}:`, err?.message || err);
        fallidos++;
      }
    }

    console.log('\n================================================================');
    console.log('📊 RESUMEN FINAL DE BACKFILL:');
    console.log(`   Total evaluados : ${expedientesCompletos.length}`);
    console.log(`   Exitosos        : ${exitosos}`);
    console.log(`   Fallidos        : ${fallidos}`);
    console.log('================================================================');
  } finally {
    await app.close();
  }
}

runBackfill().catch((err) => {
  console.error('Fatal error en script de backfill:', err);
  process.exit(1);
});

