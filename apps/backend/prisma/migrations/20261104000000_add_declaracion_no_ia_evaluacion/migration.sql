-- AlterTable
ALTER TABLE "evaluaciones" ADD COLUMN IF NOT EXISTS "declaracion_no_ia" BOOLEAN NOT NULL DEFAULT false;

