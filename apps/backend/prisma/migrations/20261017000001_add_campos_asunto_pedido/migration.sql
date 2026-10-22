-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "tipoSolicitud" VARCHAR(100) NOT NULL DEFAULT 'NA',
ADD COLUMN "motivoSolicitud" TEXT;
