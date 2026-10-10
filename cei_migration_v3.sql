-- =====================================================================
-- MIGRACIÓN v3 (aplicar DESPUÉS de v2)
-- Corrige: rondas en criterios, consolidación con evaluaciones completas,
-- controles de la regla de mayoría, observaciones bloqueantes,
-- incumplimientos críticos, RLS con políticas, firmas, envío y plazos.
-- No elimina datos. Se ejecuta una sola vez (lo verifica al inicio).
-- Convención de sesión: la app ejecuta  SET LOCAL app.user_id = '<id>'
-- =====================================================================
BEGIN;

-- ---------------------------------------------------------------------
-- 0. CONTROL DE EJECUCIÓN ÚNICA
-- ---------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.dictamen_final') IS NULL THEN
        RAISE EXCEPTION 'Aplica primero cei_migration_v2.sql';
    END IF;
    IF to_regclass('public.migracion_aplicada') IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.migracion_aplicada WHERE version = 'v3') THEN
            RAISE EXCEPTION 'La migración v3 ya fue aplicada';
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS migracion_aplicada (
    version TEXT PRIMARY KEY,
    aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO migracion_aplicada(version) VALUES ('v2') ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------
-- 1. CONFIGURACIÓN INSTITUCIONAL (valores a confirmar con el CEI)
-- ---------------------------------------------------------------------
CREATE TABLE config_cei (
    clave       VARCHAR(50) PRIMARY KEY,
    valor       TEXT NOT NULL,
    descripcion TEXT
);
INSERT INTO config_cei VALUES
 ('num_evaluadores_requeridos', '5', 'Evaluadores exactos que deben emitir voto'),
 ('tipo_dias_plazo', 'CALENDARIO', 'CALENDARIO o HABILES (usa tabla feriado)'),
 ('observaciones_bloqueantes', 'FINALIZACION',
  'DICTAMEN: una observación bloqueante pendiente impide emitir el dictamen y finalizar. FINALIZACION: solo impide finalizar.');

CREATE TABLE feriado (
    fecha       DATE PRIMARY KEY,
    descripcion VARCHAR(100)
);

-- Plazos: calendario o hábiles según config
CREATE OR REPLACE FUNCTION fn_agregar_dias_plazo(p_inicio DATE, p_dias INT) RETURNS DATE
LANGUAGE plpgsql STABLE AS $$
DECLARE d DATE := p_inicio; n INT := 0; habiles BOOLEAN;
BEGIN
    SELECT valor = 'HABILES' INTO habiles FROM config_cei WHERE clave = 'tipo_dias_plazo';
    IF NOT COALESCE(habiles, FALSE) THEN RETURN p_inicio + p_dias; END IF;
    WHILE n < p_dias LOOP
        d := d + 1;
        IF extract(isodow FROM d) < 6 AND NOT EXISTS (SELECT 1 FROM feriado WHERE fecha = d) THEN
            n := n + 1;
        END IF;
    END LOOP;
    RETURN d;
END $$;

CREATE OR REPLACE FUNCTION fn_dias_restantes(p_limite DATE) RETURNS INT
LANGUAGE sql STABLE AS $$
    SELECT CASE
      WHEN p_limite IS NULL THEN NULL
      WHEN (SELECT valor FROM config_cei WHERE clave = 'tipo_dias_plazo') = 'HABILES' THEN
        CASE WHEN p_limite >= CURRENT_DATE THEN
              (SELECT count(*) FROM generate_series((CURRENT_DATE + 1)::timestamp, p_limite::timestamp, interval '1 day') g(d)
                WHERE extract(isodow FROM d) < 6 AND d::date NOT IN (SELECT fecha FROM feriado))::int
             ELSE
             -(SELECT count(*) FROM generate_series((p_limite + 1)::timestamp, CURRENT_DATE::timestamp, interval '1 day') g(d)
                WHERE extract(isodow FROM d) < 6 AND d::date NOT IN (SELECT fecha FROM feriado))::int
        END
      ELSE p_limite - CURRENT_DATE END
$$;

-- ---------------------------------------------------------------------
-- 2. RF-001/003: fecha de presentación = fecha de ENVÍO (no del borrador)
-- ---------------------------------------------------------------------
ALTER TABLE expediente ALTER COLUMN fecha_presentacion DROP DEFAULT;
ALTER TABLE expediente ALTER COLUMN fecha_presentacion DROP NOT NULL;
ALTER TABLE expediente ADD CONSTRAINT ck_fecha_presentacion
    CHECK (estado_id = 0 OR fecha_presentacion IS NOT NULL);
COMMENT ON COLUMN expediente.fecha_presentacion IS 'Fecha oficial: se asigna al pasar de Nuevo a Creado. creado_en es la del borrador.';

-- ---------------------------------------------------------------------
-- 3. RONDAS EN evaluacion_criterio + evaluador debe estar asignado
-- ---------------------------------------------------------------------
ALTER TABLE evaluacion_criterio ADD COLUMN ronda SMALLINT NOT NULL DEFAULT 1;
ALTER TABLE evaluacion_criterio DROP CONSTRAINT evaluacion_criterio_pkey;
ALTER TABLE evaluacion_criterio ADD PRIMARY KEY (expediente_id, criterio_id, evaluador_id, ronda);

CREATE OR REPLACE FUNCTION fn_validar_evaluador_asignado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM asignacion_evaluador
                    WHERE expediente_id = NEW.expediente_id AND evaluador_id = NEW.evaluador_id
                      AND activa AND estado <> 'RECHAZADA') THEN
        RAISE EXCEPTION 'El usuario % no tiene una asignación vigente en el expediente %',
                        NEW.evaluador_id, NEW.expediente_id;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_evalcrit_asignado BEFORE INSERT ON evaluacion_criterio
    FOR EACH ROW EXECUTE FUNCTION fn_validar_evaluador_asignado();
CREATE TRIGGER trg_evalind_asignado BEFORE INSERT ON evaluacion_individual
    FOR EACH ROW EXECUTE FUNCTION fn_validar_evaluador_asignado();

-- Observaciones: texto efectivo, no solo espacios
ALTER TABLE evaluacion_criterio  DROP CONSTRAINT ck_obs_nocumple;
ALTER TABLE evaluacion_criterio  ADD CONSTRAINT ck_obs_nocumple
    CHECK (resultado <> 'NO_CUMPLE' OR length(btrim(coalesce(observaciones,''))) > 0);
ALTER TABLE evaluacion_individual DROP CONSTRAINT ck_eval_obs;
ALTER TABLE evaluacion_individual ADD CONSTRAINT ck_eval_obs
    CHECK (veredicto IS DISTINCT FROM 'APROBADO_CON_OBSERVACIONES'
           OR length(btrim(coalesce(observaciones,''))) > 0);
ALTER TABLE dictamen_final DROP CONSTRAINT ck_dictamen_obs;
ALTER TABLE dictamen_final ADD CONSTRAINT ck_dictamen_obs
    CHECK (resultado IS DISTINCT FROM 'APROBADO_CON_OBSERVACIONES'
           OR length(btrim(coalesce(observaciones_consolidadas,''))) > 0);
ALTER TABLE observacion ADD CONSTRAINT ck_obs_texto CHECK (length(btrim(texto)) > 0);

-- ---------------------------------------------------------------------
-- 4. CONSOLIDACIÓN: exige evaluaciones completas; criterios no evaluados = PENDIENTE
-- ---------------------------------------------------------------------
DROP VIEW v_cumplimiento_expediente;
DROP VIEW v_criterio_consolidado;

CREATE VIEW v_criterio_consolidado WITH (security_invoker = true) AS
WITH rondas AS (
    SELECT expediente_id, ronda FROM evaluacion_individual
    UNION
    SELECT expediente_id, ronda FROM evaluacion_criterio
), esperados AS (
    SELECT expediente_id, count(*) AS n FROM asignacion_evaluador
     WHERE activa AND estado <> 'RECHAZADA' GROUP BY expediente_id
), base AS (
    SELECT r.expediente_id, r.ronda, c.criterio_id, c.nombre, c.grupo, c.critico, c.condicional,
           e.es_ensayo_clinico, COALESCE(es.n, 0) AS esperados,
           count(ec.evaluador_id)                              AS recibidas,
           count(*) FILTER (WHERE ec.resultado = 'CUMPLE')     AS cumple,
           count(*) FILTER (WHERE ec.resultado = 'NO_CUMPLE')  AS no_cumple,
           count(*) FILTER (WHERE ec.resultado = 'NO_APLICA')  AS no_aplica
    FROM rondas r
    CROSS JOIN criterio_etico c
    JOIN expediente e ON e.expediente_id = r.expediente_id
    LEFT JOIN esperados es ON es.expediente_id = r.expediente_id
    LEFT JOIN evaluacion_criterio ec ON ec.expediente_id = r.expediente_id
          AND ec.ronda = r.ronda AND ec.criterio_id = c.criterio_id
    WHERE c.activo
    GROUP BY r.expediente_id, r.ronda, c.criterio_id, c.nombre, c.grupo, c.critico,
             c.condicional, e.es_ensayo_clinico, es.n
)
SELECT expediente_id, ronda, criterio_id, nombre, grupo, critico,
       esperados AS evaluadores_esperados, recibidas AS evaluaciones_recibidas,
       cumple, no_cumple, no_aplica,
       (cumple > 0 AND no_cumple > 0) AS hay_discrepancia,
       CASE WHEN condicional AND NOT es_ensayo_clinico THEN 'NO_APLICA'
            WHEN esperados = 0 OR recibidas < esperados   THEN 'PENDIENTE'
            WHEN cumple + no_cumple = 0                   THEN 'NO_APLICA'
            WHEN cumple > no_cumple                       THEN 'CUMPLE'
            WHEN no_cumple > cumple                       THEN 'NO_CUMPLE'
            ELSE 'EMPATE' END AS resultado_consolidado
FROM base;

-- El porcentaje DEFINITIVO solo existe si no queda ningún criterio pendiente
CREATE VIEW v_cumplimiento_expediente WITH (security_invoker = true) AS
SELECT expediente_id, ronda,
       count(*) FILTER (WHERE resultado_consolidado = 'CUMPLE')                         AS criterios_cumplidos,
       count(*) FILTER (WHERE resultado_consolidado NOT IN ('NO_APLICA','PENDIENTE'))   AS criterios_evaluables,
       count(*) FILTER (WHERE resultado_consolidado = 'PENDIENTE')                      AS criterios_pendientes,
       bool_and(resultado_consolidado <> 'PENDIENTE')                                   AS evaluacion_completa,
       CASE WHEN bool_and(resultado_consolidado <> 'PENDIENTE')
            THEN round(100.0 * count(*) FILTER (WHERE resultado_consolidado = 'CUMPLE')
                 / NULLIF(count(*) FILTER (WHERE resultado_consolidado <> 'NO_APLICA'),0), 1)
       END AS porcentaje_definitivo,
       round(100.0 * count(*) FILTER (WHERE resultado_consolidado = 'CUMPLE')
             / NULLIF(count(*) FILTER (WHERE resultado_consolidado NOT IN ('NO_APLICA','PENDIENTE')),0), 1)
            AS porcentaje_parcial,
       bool_or(critico AND resultado_consolidado IN ('NO_CUMPLE','EMPATE'))             AS incumplimiento_critico,
       bool_or(critico AND resultado_consolidado = 'PENDIENTE')                         AS critico_pendiente,
       bool_or(hay_discrepancia)                                                        AS hay_discrepancias
FROM v_criterio_consolidado
GROUP BY expediente_id, ronda;

-- ---------------------------------------------------------------------
-- 5. DELIBERACIÓN TRAZABLE
-- ---------------------------------------------------------------------
CREATE TABLE decision_comite (
    decision_id  BIGSERIAL PRIMARY KEY,
    dictamen_id  BIGINT NOT NULL REFERENCES dictamen_final(dictamen_id) ON DELETE CASCADE,
    metodo       metodo_decision NOT NULL CHECK (metodo IN ('DELIBERACION_COMITE','NUEVA_VOTACION')),
    resultado    tipo_recomendacion,
    acta         TEXT NOT NULL CHECK (length(btrim(acta)) > 0),
    decidido_por BIGINT NOT NULL REFERENCES usuario(usuario_id),
    decidido_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_decision_resultado CHECK (metodo = 'NUEVA_VOTACION' OR resultado IS NOT NULL)
);
CREATE INDEX ix_decision_dictamen ON decision_comite(dictamen_id);

-- ---------------------------------------------------------------------
-- 6. HELPERS DE SESIÓN / ROLES
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_usuario_actual() RETURNS BIGINT
LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.user_id', true), '')::BIGINT $$;

CREATE OR REPLACE FUNCTION fn_tiene_rol(VARIADIC p_roles INT[]) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM usuario_rol ur JOIN usuario u USING (usuario_id)
                    WHERE ur.usuario_id = fn_usuario_actual() AND u.activo
                      AND ur.rol_id::int = ANY (p_roles))
$$;

CREATE OR REPLACE FUNCTION fn_es_evaluador_de(p_expediente BIGINT) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM asignacion_evaluador
                    WHERE expediente_id = p_expediente AND evaluador_id = fn_usuario_actual()
                      AND activa AND estado <> 'RECHAZADA')
$$;

-- ---------------------------------------------------------------------
-- 7. EMISIÓN DEL DICTAMEN (regla de mayoría con controles)
--    Solo Presidente (3), Secretaría Técnica (5) o Administrador (8).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_emitir_dictamen(p_expediente BIGINT, p_ronda SMALLINT DEFAULT 1,
                                              p_usuario BIGINT DEFAULT NULL)
RETURNS dictamen_final LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_req SMALLINT; v_total SMALLINT; v_pend SMALLINT; v_enviadas SMALLINT; v_may SMALLINT;
    a SMALLINT; ao SMALLINT; n SMALLINT;
    v_res tipo_recomendacion; v_regla TEXT; v_obs TEXT; v_crit BOOLEAN; r dictamen_final;
    v_usuario BIGINT := COALESCE(p_usuario, fn_usuario_actual());
BEGIN
    IF NOT fn_tiene_rol(3,5,8) THEN
        RAISE EXCEPTION 'No tiene permiso para emitir el dictamen';
    END IF;

    SELECT valor::smallint INTO v_req FROM config_cei WHERE clave = 'num_evaluadores_requeridos';

    SELECT count(*), count(*) FILTER (WHERE estado = 'PENDIENTE') INTO v_total, v_pend
      FROM asignacion_evaluador
     WHERE expediente_id = p_expediente AND activa AND estado <> 'RECHAZADA';
    IF v_total <> v_req THEN
        RAISE EXCEPTION 'Se requieren exactamente % evaluadores asignados (hay %)', v_req, v_total;
    END IF;
    IF v_pend > 0 THEN
        RAISE EXCEPTION 'Hay % asignaciones pendientes de aceptar o rechazar', v_pend;
    END IF;

    -- Solo votos de evaluadores asignados (la PK impide duplicados por ronda)
    SELECT count(*),
           count(*) FILTER (WHERE ei.veredicto = 'APROBADO'),
           count(*) FILTER (WHERE ei.veredicto = 'APROBADO_CON_OBSERVACIONES'),
           count(*) FILTER (WHERE ei.veredicto = 'NO_APROBADO')
      INTO v_enviadas, a, ao, n
      FROM evaluacion_individual ei
      JOIN asignacion_evaluador asg ON asg.expediente_id = ei.expediente_id
           AND asg.evaluador_id = ei.evaluador_id AND asg.activa AND asg.estado <> 'RECHAZADA'
     WHERE ei.expediente_id = p_expediente AND ei.ronda = p_ronda AND ei.estado = 'ENVIADA';
    IF v_enviadas <> v_total THEN
        RAISE EXCEPTION 'Faltan evaluaciones: % de % enviadas', v_enviadas, v_total;
    END IF;

    IF (SELECT valor FROM config_cei WHERE clave = 'observaciones_bloqueantes') = 'DICTAMEN'
       AND EXISTS (SELECT 1 FROM observacion WHERE expediente_id = p_expediente
                    AND bloquea_aprobacion AND resuelta_en IS NULL) THEN
        RAISE EXCEPTION 'Hay observaciones bloqueantes sin resolver';
    END IF;

    v_may := v_total / 2 + 1;
    v_res := CASE WHEN a  >= v_may THEN 'APROBADO'
                  WHEN ao >= v_may THEN 'APROBADO_CON_OBSERVACIONES'
                  WHEN n  >= v_may THEN 'NO_APROBADO' END;
    v_regla := format('Mayoría absoluta: al menos %s de %s votos', v_may, v_total);

    -- Una mayoría favorable no puede ocultar un incumplimiento crítico
    SELECT EXISTS (SELECT 1 FROM v_criterio_consolidado
                    WHERE expediente_id = p_expediente AND ronda = p_ronda AND critico
                      AND resultado_consolidado IN ('NO_CUMPLE','EMPATE','PENDIENTE'))
      INTO v_crit;
    IF v_res IN ('APROBADO','APROBADO_CON_OBSERVACIONES') AND v_crit THEN
        v_res := NULL;
        v_regla := 'Mayoría favorable bloqueada: criterio crítico incumplido o sin evaluar; requiere deliberación';
    ELSIF v_res IS NULL THEN
        v_regla := format('Sin mayoría absoluta (%s requeridos): pasa a deliberación', v_may);
    END IF;

    SELECT string_agg(u.nombre || ': ' || ei.observaciones, E'\n- ' ORDER BY u.nombre) INTO v_obs
      FROM evaluacion_individual ei JOIN usuario u ON u.usuario_id = ei.evaluador_id
     WHERE ei.expediente_id = p_expediente AND ei.ronda = p_ronda AND ei.estado = 'ENVIADA'
       AND ei.veredicto <> 'APROBADO' AND length(btrim(coalesce(ei.observaciones,''))) > 0;

    INSERT INTO dictamen_final(expediente_id, ronda, total_evaluadores, mayoria_requerida,
            votos_aprobado, votos_aprobado_obs, votos_no_aprobado, resultado, estado, metodo,
            regla_aplicada, observaciones_consolidadas, fecha_emision, emitido_por)
    VALUES (p_expediente, p_ronda, v_total, v_may, a, ao, n, v_res,
            CASE WHEN v_res IS NULL THEN 'EN_DELIBERACION'::estado_dictamen ELSE 'EMITIDO' END,
            CASE WHEN v_res IS NULL THEN 'DELIBERACION_COMITE'::metodo_decision ELSE 'MAYORIA_ABSOLUTA' END,
            v_regla, v_obs, CASE WHEN v_res IS NULL THEN NULL ELSE CURRENT_DATE END, v_usuario)
    RETURNING * INTO r;

    -- Conserva la autoría de cada observación
    INSERT INTO observacion(expediente_id, dictamen_id, autor_id, texto)
    SELECT ei.expediente_id, r.dictamen_id, ei.evaluador_id, ei.observaciones
      FROM evaluacion_individual ei
     WHERE ei.expediente_id = p_expediente AND ei.ronda = p_ronda AND ei.estado = 'ENVIADA'
       AND ei.veredicto <> 'APROBADO' AND length(btrim(coalesce(ei.observaciones,''))) > 0;
    RETURN r;
END $$;

-- Resolver una deliberación: decisión del Comité o nueva votación (queda registrada)
CREATE OR REPLACE FUNCTION fn_resolver_deliberacion(p_dictamen BIGINT, p_metodo metodo_decision,
        p_resultado tipo_recomendacion, p_acta TEXT, p_usuario BIGINT DEFAULT NULL)
RETURNS dictamen_final LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d dictamen_final; v_usuario BIGINT := COALESCE(p_usuario, fn_usuario_actual());
BEGIN
    IF NOT fn_tiene_rol(3,5,8) THEN
        RAISE EXCEPTION 'No tiene permiso para resolver la deliberación';
    END IF;
    SELECT * INTO d FROM dictamen_final WHERE dictamen_id = p_dictamen FOR UPDATE;
    IF NOT FOUND OR d.estado <> 'EN_DELIBERACION' THEN
        RAISE EXCEPTION 'El dictamen no está en deliberación';
    END IF;
    IF p_metodo NOT IN ('DELIBERACION_COMITE','NUEVA_VOTACION') THEN
        RAISE EXCEPTION 'Método no válido para resolver una deliberación';
    END IF;

    INSERT INTO decision_comite(dictamen_id, metodo, resultado, acta, decidido_por)
    VALUES (p_dictamen, p_metodo, p_resultado, p_acta, v_usuario);

    IF p_metodo = 'NUEVA_VOTACION' THEN
        UPDATE dictamen_final SET metodo = 'NUEVA_VOTACION', acta_deliberacion = p_acta
         WHERE dictamen_id = p_dictamen RETURNING * INTO d;   -- la siguiente ronda usa ronda+1
    ELSE
        UPDATE dictamen_final
           SET resultado = p_resultado, estado = 'EMITIDO', metodo = 'DELIBERACION_COMITE',
               acta_deliberacion = p_acta, fecha_emision = CURRENT_DATE, emitido_por = v_usuario
         WHERE dictamen_id = p_dictamen RETURNING * INTO d;
    END IF;
    RETURN d;
END $$;

-- ---------------------------------------------------------------------
-- 8. RF-008: firmas válidas y consistentes
-- ---------------------------------------------------------------------
ALTER TABLE firma_expediente
    ADD COLUMN firma_valor        TEXT,     -- firma criptográfica (la verifica la app / PKI)
    ADD COLUMN certificado_huella TEXT;
ALTER TABLE firma_expediente ADD CONSTRAINT ck_firma_valida CHECK (
    estado_validacion <> 'VALIDA' OR
    (firmado_en IS NOT NULL AND validado_en IS NOT NULL AND hash_documento IS NOT NULL
     AND evidencia_firma IS NOT NULL AND firma_valor IS NOT NULL AND certificado_huella IS NOT NULL));
COMMENT ON TABLE firma_expediente IS 'La BD solo acepta VALIDA con evidencia completa; la verificación criptográfica la hace la aplicación/PKI.';

-- ---------------------------------------------------------------------
-- 9. RF-013: envío coherente con su estado
-- ---------------------------------------------------------------------
ALTER TABLE envio_resultado ALTER COLUMN enviado_en DROP DEFAULT;
ALTER TABLE envio_resultado ALTER COLUMN enviado_en DROP NOT NULL;
ALTER TABLE envio_resultado ADD CONSTRAINT ck_envio_coherente CHECK (
    (estado_envio IN ('PENDIENTE','FALLIDO') OR enviado_en IS NOT NULL)
    AND (estado_envio <> 'RECEPCION_CONFIRMADA' OR recepcion_confirmada_en IS NOT NULL)
    AND (recepcion_confirmada_en IS NULL OR estado_envio = 'RECEPCION_CONFIRMADA')
    AND (estado_envio <> 'FALLIDO' OR error_envio IS NOT NULL));

CREATE OR REPLACE FUNCTION fn_sync_envio() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.recepcion_confirmada_en IS NOT NULL THEN
        NEW.estado_envio := 'RECEPCION_CONFIRMADA';
        NEW.enviado_en := COALESCE(NEW.enviado_en, NEW.recepcion_confirmada_en);
    ELSIF NEW.estado_envio = 'ENVIADO' THEN
        NEW.enviado_en := COALESCE(NEW.enviado_en, now());
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_envio_sync BEFORE INSERT OR UPDATE ON envio_resultado
    FOR EACH ROW EXECUTE FUNCTION fn_sync_envio();

CREATE OR REPLACE FUNCTION fn_validar_anexo9() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM documento
                    WHERE documento_id = NEW.documento_id
                      AND expediente_id = NEW.expediente_id AND tipo = 'ANEXO_9') THEN
        RAISE EXCEPTION 'El documento enviado debe ser el Anexo N°9 de este expediente';
    END IF;
    RETURN NEW;
END $$;

-- ---------------------------------------------------------------------
-- 10. TRANSICIONES CON PRECONDICIONES REALES
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_registrar_cambio_estado() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.estado_id IS DISTINCT FROM OLD.estado_id THEN
        IF NOT EXISTS (SELECT 1 FROM transicion_estado
                        WHERE desde_id = OLD.estado_id AND hasta_id = NEW.estado_id) THEN
            RAISE EXCEPTION 'Transición de estado no permitida: % -> %', OLD.estado_id, NEW.estado_id;
        END IF;
        IF OLD.estado_id = 0 AND NEW.estado_id = 1 THEN
            NEW.enviado_en := now();
            NEW.fecha_presentacion := CURRENT_DATE;
        END IF;
        IF NEW.estado_id = 3 AND NOT EXISTS (SELECT 1 FROM dictamen_final
                WHERE expediente_id = NEW.expediente_id AND estado = 'EMITIDO') THEN
            RAISE EXCEPTION 'No hay un dictamen emitido para este expediente';
        END IF;
        IF NEW.estado_id = 4 AND (SELECT count(DISTINCT rol_id) FROM firma_expediente
                WHERE expediente_id = NEW.expediente_id AND estado_validacion = 'VALIDA') < 5 THEN
            RAISE EXCEPTION 'Faltan firmas válidas de los cinco integrantes del Comité';
        END IF;
        IF NEW.estado_id = 5 AND EXISTS (SELECT 1 FROM observacion
                WHERE expediente_id = NEW.expediente_id AND bloquea_aprobacion AND resuelta_en IS NULL) THEN
            RAISE EXCEPTION 'Hay observaciones bloqueantes sin resolver';
        END IF;
        IF NEW.estado_id = 6 AND NOT EXISTS (SELECT 1 FROM envio_resultado
                WHERE expediente_id = NEW.expediente_id
                  AND estado_envio IN ('ENVIADO','RECEPCION_CONFIRMADA')) THEN
            RAISE EXCEPTION 'No existe un envío efectuado del Anexo N°9';
        END IF;
    END IF;

    IF TG_OP = 'INSERT' OR NEW.estado_id IS DISTINCT FROM OLD.estado_id THEN
        INSERT INTO historial_estado(expediente_id, estado_anterior, estado_nuevo, usuario_id)
        VALUES (NEW.expediente_id,
                CASE WHEN TG_OP = 'UPDATE' THEN OLD.estado_id END,
                NEW.estado_id, fn_usuario_actual());
    END IF;
    NEW.actualizado_en := now();
    RETURN NEW;
END $$;

-- ---------------------------------------------------------------------
-- 11. VISTAS ACTUALIZADAS (fecha de envío, plazos hábiles/calendario)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_cola_trabajo AS
SELECT est.rol_destino_id AS rol_id, r.nombre AS rol_destino,
       e.expediente_id, e.codigo, e.titulo, u.nombre AS solicitante,
       COALESCE(e.fecha_presentacion, e.creado_en::date) AS fecha_ingreso, est.nombre AS estado
FROM expediente e
JOIN estado_expediente est ON est.estado_id = e.estado_id
JOIN rol r ON r.rol_id = est.rol_destino_id
JOIN usuario u ON u.usuario_id = e.solicitante_id
WHERE e.estado_id < 6;

CREATE OR REPLACE VIEW v_seguimiento_expediente AS
SELECT e.expediente_id, e.codigo, e.titulo, e.fecha_presentacion,
       est.nombre AS estado, u.nombre AS solicitante,
       (SELECT string_agg(p.nombre, '; ' ORDER BY p.orden)
          FROM expediente_participante p
         WHERE p.expediente_id = e.expediente_id AND p.es_responsable) AS investigadores,
       (SELECT string_agg(ev.nombre, '; ')
          FROM asignacion_evaluador a JOIN usuario ev ON ev.usuario_id = a.evaluador_id
         WHERE a.expediente_id = e.expediente_id AND a.activa) AS evaluadores,
       e.ultima_notificacion_en, e.plazo_inicio, e.plazo_limite,
       fn_dias_restantes(e.plazo_limite) AS dias_restantes,
       CASE WHEN e.plazo_limite IS NULL THEN NULL
            WHEN e.plazo_limite >= CURRENT_DATE THEN 'VIGENTE' ELSE 'VENCIDO' END AS estado_plazo
FROM expediente e
JOIN estado_expediente est ON est.estado_id = e.estado_id
JOIN usuario u ON u.usuario_id = e.solicitante_id;

-- ---------------------------------------------------------------------
-- 12. RLS: políticas explícitas y permisos del rol de la aplicación
--     La app se conecta como cei_app y fija app.user_id en cada transacción.
--     (En Supabase, sustituye por authenticated / auth.uid().)
-- ---------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cei_app') THEN
        CREATE ROLE cei_app NOLOGIN;
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO cei_app;
GRANT SELECT ON rol, estado_expediente, tipo_investigacion, unidad_academica, criterio_etico,
      transicion_estado, config_cei, config_plazo, feriado, usuario, usuario_rol,
      asignacion_evaluador, decision_comite, documento TO cei_app;
GRANT SELECT, INSERT, UPDATE ON expediente, evaluacion_individual, evaluacion_criterio,
      dictamen_final, observacion TO cei_app;
GRANT SELECT ON v_criterio_consolidado, v_cumplimiento_expediente, v_cola_trabajo,
      v_seguimiento_expediente, v_vencimiento_proximo TO cei_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO cei_app;
ALTER TABLE decision_comite ENABLE ROW LEVEL SECURITY;

-- Roles de Comité: 3 Presidente, 4 Vicepresidente, 5 Sec. Técnica, 6 Sec. Administrativa, 7 Vocal; 8 Admin
CREATE POLICY usuario_sel ON usuario FOR SELECT
    USING (usuario_id = fn_usuario_actual() OR fn_tiene_rol(3,4,5,6,7,8));

CREATE POLICY exp_sel ON expediente FOR SELECT
    USING (solicitante_id = fn_usuario_actual() OR fn_tiene_rol(3,4,5,6,7,8)
           OR fn_es_evaluador_de(expediente_id));
CREATE POLICY exp_ins ON expediente FOR INSERT
    WITH CHECK (solicitante_id = fn_usuario_actual() AND estado_id = 0);
CREATE POLICY exp_upd ON expediente FOR UPDATE
    USING ((solicitante_id = fn_usuario_actual() AND estado_id = 0) OR fn_tiene_rol(3,4,5,6,8))
    WITH CHECK ((solicitante_id = fn_usuario_actual() AND estado_id IN (0,1)) OR fn_tiene_rol(3,4,5,6,8));

CREATE POLICY evalind_sel ON evaluacion_individual FOR SELECT
    USING (evaluador_id = fn_usuario_actual() OR fn_tiene_rol(3,4,5,6,7,8));
CREATE POLICY evalind_ins ON evaluacion_individual FOR INSERT
    WITH CHECK (evaluador_id = fn_usuario_actual());
CREATE POLICY evalind_upd ON evaluacion_individual FOR UPDATE
    USING (evaluador_id = fn_usuario_actual() AND estado = 'PENDIENTE')
    WITH CHECK (evaluador_id = fn_usuario_actual());

CREATE POLICY evalcrit_sel ON evaluacion_criterio FOR SELECT
    USING (evaluador_id = fn_usuario_actual() OR fn_tiene_rol(3,4,5,6,7,8));
CREATE POLICY evalcrit_ins ON evaluacion_criterio FOR INSERT
    WITH CHECK (evaluador_id = fn_usuario_actual());
CREATE POLICY evalcrit_upd ON evaluacion_criterio FOR UPDATE
    USING (evaluador_id = fn_usuario_actual()) WITH CHECK (evaluador_id = fn_usuario_actual());

CREATE POLICY dict_sel ON dictamen_final FOR SELECT
    USING (fn_tiene_rol(3,4,5,6,7,8)
           OR EXISTS (SELECT 1 FROM expediente e WHERE e.expediente_id = dictamen_final.expediente_id
                       AND e.solicitante_id = fn_usuario_actual() AND e.estado_id = 6));
CREATE POLICY dict_ins ON dictamen_final FOR INSERT WITH CHECK (fn_tiene_rol(3,5,8));
CREATE POLICY dict_upd ON dictamen_final FOR UPDATE USING (fn_tiene_rol(3,5,8)) WITH CHECK (fn_tiene_rol(3,5,8));

CREATE POLICY obs_sel ON observacion FOR SELECT
    USING (autor_id = fn_usuario_actual() OR fn_tiene_rol(3,4,5,6,7,8)
           OR EXISTS (SELECT 1 FROM expediente e WHERE e.expediente_id = observacion.expediente_id
                       AND e.solicitante_id = fn_usuario_actual() AND e.estado_id = 6));
CREATE POLICY obs_ins ON observacion FOR INSERT
    WITH CHECK (autor_id = fn_usuario_actual()
                AND (fn_es_evaluador_de(expediente_id) OR fn_tiene_rol(3,4,5,6,7,8)));
CREATE POLICY obs_upd ON observacion FOR UPDATE USING (fn_tiene_rol(3,5,8)) WITH CHECK (fn_tiene_rol(3,5,8));

CREATE POLICY decision_sel ON decision_comite FOR SELECT USING (fn_tiene_rol(3,4,5,6,7,8));

INSERT INTO migracion_aplicada(version) VALUES ('v3');
COMMIT;
