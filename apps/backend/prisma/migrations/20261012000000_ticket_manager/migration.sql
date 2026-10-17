-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('BORRADOR', 'ENVIADA', 'EN_REVISION', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EstadoExpediente" AS ENUM ('INICIADO', 'DOCUMENTACION_PENDIENTE', 'EN_EVALUACION', 'OBSERVADO', 'APROBADO', 'RECHAZADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "TipoVoto" AS ENUM ('APROBADO', 'OBSERVADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "ResultadoEvaluacion" AS ENUM ('APROBADO', 'APROBADO_CON_OBSERVACIONES', 'NO_APROBADO');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('EMAIL', 'SISTEMA', 'WEBSOCKET');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('BORRADOR', 'REGISTRADO', 'EN_REVISION_PREVIA', 'OBSERVADO', 'SUBSANADO', 'ADMITIDO', 'EXPEDIENTE_GENERADO', 'RECHAZADO', 'CANCELADO', 'RETIRADO', 'ARCHIVADO');

-- CreateEnum
CREATE TYPE "PrioridadTicket" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "EstadoDocumentoAdjunto" AS ENUM ('PENDIENTE_VALIDACION', 'CONFORME', 'OBSERVADO', 'REEMPLAZADO');

-- CreateTable
CREATE TABLE "roles" (
    "id" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT '',
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_roles" (
    "usuarioId" TEXT NOT NULL,
    "rolId" INTEGER NOT NULL,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("usuarioId","rolId")
);

-- CreateTable
CREATE TABLE "solicitudes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'BORRADOR',
    "solicitanteId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expedientes" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "estado" "EstadoExpediente" NOT NULL DEFAULT 'INICIADO',
    "solicitudId" TEXT,
    "gestorId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expedientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "ticketDocumentoId" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "evaluadorId" TEXT NOT NULL,
    "tipo" "TipoVoto" NOT NULL,
    "comentario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluaciones" (
    "id" TEXT NOT NULL,
    "expedienteId" TEXT NOT NULL,
    "evaluadorId" TEXT NOT NULL,
    "principiosEticos" TEXT,
    "normativaLegal" TEXT,
    "resultado" "ResultadoEvaluacion",
    "recomendacion" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmas" (
    "id" TEXT NOT NULL,
    "evaluacionId" TEXT NOT NULL,
    "firmadoPor" TEXT NOT NULL,
    "firma" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "descripcion" TEXT,
    "usuarioId" TEXT,
    "solicitudId" TEXT,
    "expedienteId" TEXT,
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "canal" "CanalNotificacion" NOT NULL DEFAULT 'SISTEMA',
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "familiaInicio" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "revocado" BOOLEAN NOT NULL DEFAULT false,
    "revocadoEn" TIMESTAMP(3),
    "reemplazadoPor" TEXT,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_tramite" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tipos_tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requisitos_documentales" (
    "id" TEXT NOT NULL,
    "tipoTramiteId" TEXT NOT NULL,
    "tipoDocumental" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "requisitos_documentales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secuencias" (
    "clave" TEXT NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "secuencias_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "titulo" VARCHAR(500) NOT NULL,
    "descripcion" TEXT,
    "categoria" VARCHAR(100),
    "tipoTramiteId" TEXT,
    "estado" "EstadoTicket" NOT NULL DEFAULT 'BORRADOR',
    "prioridad" "PrioridadTicket" NOT NULL DEFAULT 'NORMAL',
    "claveDuplicidad" VARCHAR(500),
    "investigadores" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unidadAcademica" VARCHAR(100) DEFAULT 'NA',
    "tipoInvestigacion" VARCHAR(50),
    "tipoInvestigacionOtro" VARCHAR(255),
    "fechaPresentacion" TIMESTAMP(3),
    "financiamiento" VARCHAR(20),
    "financiamientoDetalle" VARCHAR(255),
    "codigoSolicitante" VARCHAR(100),
    "naturalezaProyecto" VARCHAR(255),
    "participantes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "modalidad" VARCHAR(100),
    "planProyecto" TEXT,
    "solicitanteId" TEXT NOT NULL,
    "asignadoAId" TEXT,
    "expedienteId" TEXT,
    "metadata" JSONB,
    "plazoSubsanacion" TIMESTAMP(3),
    "prorrogaDias" INTEGER NOT NULL DEFAULT 0,
    "slaPausadoDesde" TIMESTAMP(3),
    "diasPausados" INTEGER NOT NULL DEFAULT 0,
    "plazoReconsideracion" TIMESTAMP(3),
    "fechaRespuesta" TIMESTAMP(3),
    "resultadoEvaluacionExterna" VARCHAR(30),
    "calificacionExternaJson" JSONB,
    "fechaRecepcionEvaluacion" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "cerradoEn" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_documentos" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "nombreOriginal" VARCHAR(255) NOT NULL,
    "nombreArchivo" VARCHAR(255) NOT NULL,
    "tipoDocumental" VARCHAR(100) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "tamanioBytes" INTEGER NOT NULL,
    "hashSha256" CHAR(64) NOT NULL,
    "storagePath" VARCHAR(1000) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoDocumentoAdjunto" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
    "subidoPorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_observaciones" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "documentoId" TEXT,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" TIMESTAMP(3),

    CONSTRAINT "ticket_observaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_historial" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "estadoAnterior" "EstadoTicket",
    "estadoNuevo" "EstadoTicket" NOT NULL,
    "motivo" TEXT,
    "accion" VARCHAR(50) NOT NULL,
    "usuarioId" TEXT,
    "metadata" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_historial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_codigo_key" ON "roles"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_codigo_key" ON "expedientes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "expedientes_solicitudId_key" ON "expedientes"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_ticketDocumentoId_key" ON "documentos"("ticketDocumentoId");

-- CreateIndex
CREATE UNIQUE INDEX "votos_documentoId_evaluadorId_key" ON "votos"("documentoId", "evaluadorId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuarioId_idx" ON "refresh_tokens"("usuarioId");

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiraEn_idx" ON "refresh_tokens"("expiraEn");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_tramite_codigo_key" ON "tipos_tramite"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "requisitos_documentales_tipoTramiteId_tipoDocumental_key" ON "requisitos_documentales"("tipoTramiteId", "tipoDocumental");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_codigo_key" ON "tickets"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_expedienteId_key" ON "tickets"("expedienteId");

-- CreateIndex
CREATE INDEX "tickets_solicitanteId_idx" ON "tickets"("solicitanteId");

-- CreateIndex
CREATE INDEX "tickets_asignadoAId_idx" ON "tickets"("asignadoAId");

-- CreateIndex
CREATE INDEX "tickets_estado_idx" ON "tickets"("estado");

-- CreateIndex
CREATE INDEX "ticket_documentos_ticketId_idx" ON "ticket_documentos"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_documentos_hashSha256_idx" ON "ticket_documentos"("hashSha256");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_documentos_ticketId_tipoDocumental_version_key" ON "ticket_documentos"("ticketId", "tipoDocumental", "version");

-- CreateIndex
CREATE INDEX "ticket_observaciones_ticketId_idx" ON "ticket_observaciones"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_historial_ticketId_idx" ON "ticket_historial"("ticketId");

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_ticketDocumentoId_fkey" FOREIGN KEY ("ticketDocumentoId") REFERENCES "ticket_documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos" ADD CONSTRAINT "votos_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_evaluadorId_fkey" FOREIGN KEY ("evaluadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmas" ADD CONSTRAINT "firmas_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "evaluaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmas" ADD CONSTRAINT "firmas_firmadoPor_fkey" FOREIGN KEY ("firmadoPor") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial" ADD CONSTRAINT "historial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial" ADD CONSTRAINT "historial_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "solicitudes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial" ADD CONSTRAINT "historial_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requisitos_documentales" ADD CONSTRAINT "requisitos_documentales_tipoTramiteId_fkey" FOREIGN KEY ("tipoTramiteId") REFERENCES "tipos_tramite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tipoTramiteId_fkey" FOREIGN KEY ("tipoTramiteId") REFERENCES "tipos_tramite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_expedienteId_fkey" FOREIGN KEY ("expedienteId") REFERENCES "expedientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_documentos" ADD CONSTRAINT "ticket_documentos_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_documentos" ADD CONSTRAINT "ticket_documentos_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_observaciones" ADD CONSTRAINT "ticket_observaciones_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_observaciones" ADD CONSTRAINT "ticket_observaciones_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_observaciones" ADD CONSTRAINT "ticket_observaciones_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "ticket_documentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historial" ADD CONSTRAINT "ticket_historial_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_historial" ADD CONSTRAINT "ticket_historial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;



-- ==========================================
-- REGLAS DE NEGOCIO E INTEGRIDAD PERSONALIZADAS
-- ==========================================

-- R1: un documento vigente por tipo y ticket
CREATE UNIQUE INDEX "ticket_doc_vigente_uniq"
  ON "ticket_documentos" ("ticketId", "tipoDocumental")
  WHERE "estado" <> 'REEMPLAZADO';

-- R6: duplicado activo por solicitante
CREATE UNIQUE INDEX "ticket_solicitante_duplicidad_uniq"
  ON "tickets" ("solicitanteId", "claveDuplicidad")
  WHERE "claveDuplicidad" IS NOT NULL
    AND "estado" NOT IN ('CANCELADO', 'RETIRADO', 'ARCHIVADO', 'RECHAZADO')
    AND ("resultadoEvaluacionExterna" IS NULL OR "resultadoEvaluacionExterna" <> 'NO_APROBADO');

-- Catálogos cerrados (defensa en profundidad, además de @IsIn)
ALTER TABLE "tickets" ADD CONSTRAINT "ticket_tipo_investigacion_chk"
  CHECK ("tipoInvestigacion" IS NULL OR "tipoInvestigacion" IN
    ('Tesis de pregrado', 'Tesis de posgrado', 'Proyecto de investigación docente', 'Otro'));
ALTER TABLE "tickets" ADD CONSTRAINT "ticket_financiamiento_chk"
  CHECK ("financiamiento" IS NULL OR "financiamiento" IN ('Autofinanciado', 'UNTELS', 'Externo'));
ALTER TABLE "tickets" ADD CONSTRAINT "ticket_resultado_externo_chk"
  CHECK ("resultadoEvaluacionExterna" IS NULL OR "resultadoEvaluacionExterna" IN
    ('APROBADO', 'APROBADO_CON_OBSERVACIONES', 'NO_APROBADO'));

-- R8: condicionales obligatorios fuera de BORRADOR
ALTER TABLE "tickets" ADD CONSTRAINT "ticket_financiamiento_externo_chk"
  CHECK ("estado" = 'BORRADOR' OR "financiamiento" IS DISTINCT FROM 'Externo'
         OR ("financiamientoDetalle" IS NOT NULL AND btrim("financiamientoDetalle") <> ''));
ALTER TABLE "tickets" ADD CONSTRAINT "ticket_tipo_otro_chk"
  CHECK ("estado" = 'BORRADOR' OR "tipoInvestigacion" IS DISTINCT FROM 'Otro'
         OR ("tipoInvestigacionOtro" IS NOT NULL AND btrim("tipoInvestigacionOtro") <> ''));
