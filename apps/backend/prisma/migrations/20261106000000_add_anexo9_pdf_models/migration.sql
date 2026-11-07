-- CreateEnum
CREATE TYPE "EstadoDocumentoExpediente" AS ENUM ('VIGENTE', 'ANULADO');

-- CreateEnum
CREATE TYPE "TipoDocumentoExpediente" AS ENUM ('ANEXO_9', 'DICTAMEN_FINAL', 'RESOLUCION_CEI');

-- AlterTable
ALTER TABLE "expedientes" ADD COLUMN IF NOT EXISTS "anexo9DocumentoId" TEXT,
ADD COLUMN IF NOT EXISTS "anexo9GeneradoEn" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "anexo9Url" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "expediente_documentos" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "ticketId" TEXT,
    "sesionVotacionId" TEXT,
    "codigoExpediente" VARCHAR(50) NOT NULL,
    "codigoTicket" VARCHAR(50),
    "tipoDocumento" "TipoDocumentoExpediente" NOT NULL DEFAULT 'ANEXO_9',
    "estado" "EstadoDocumentoExpediente" NOT NULL DEFAULT 'VIGENTE',
    "dictamenFinal" TEXT NOT NULL,
    "nombreArchivo" VARCHAR(255) NOT NULL,
    "storagePath" VARCHAR(1000) NOT NULL,
    "urlPublica" TEXT,
    "mimeType" VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
    "tamanioBytes" INTEGER NOT NULL,
    "totalPaginas" INTEGER NOT NULL,
    "hashSha256" CHAR(64) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "firmantesSnapshot" JSONB NOT NULL,
    "creadoPor" TEXT NOT NULL DEFAULT 'SISTEMA_CEI',
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anuladoEn" TIMESTAMP(3),
    "motivoAnulacion" TEXT,

    CONSTRAINT "expediente_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expediente_documentos_codigoExpediente_idx" ON "expediente_documentos"("codigoExpediente");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expediente_documentos_codigoTicket_idx" ON "expediente_documentos"("codigoTicket");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expediente_documentos_hashSha256_idx" ON "expediente_documentos"("hashSha256");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "expediente_documentos_sesionVotacionId_idx" ON "expediente_documentos"("sesionVotacionId");

-- CreateIndex
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expediente_documentos_expedienteId_tipoDocumento_version_key'
    ) THEN
        ALTER TABLE "expediente_documentos" ADD CONSTRAINT "expediente_documentos_expedienteId_tipoDocumento_version_key" UNIQUE ("expedienteId", "tipoDocumento", "version");
    END IF;
END $$;

-- CreateIndex
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expedientes_anexo9DocumentoId_key'
    ) THEN
        ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_anexo9DocumentoId_key" UNIQUE ("anexo9DocumentoId");
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expedientes_anexo9DocumentoId_fkey'
    ) THEN
        ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_anexo9DocumentoId_fkey" FOREIGN KEY ("anexo9DocumentoId") REFERENCES "expediente_documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expediente_documentos_expedienteId_fkey'
    ) THEN
        ALTER TABLE "expediente_documentos" ADD CONSTRAINT "expediente_documentos_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

