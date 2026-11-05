import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { EvaluationSessionService } from './evaluation-session.service';
import {
  StepEvaluacionId,
  StepItem,
  EVALUACION_STEPS,
  DatosGeneralesProyecto,
  DEFAULT_DATOS_GENERALES,
  DocumentoExpedienteItem,
  DEFAULT_EXPEDIENTE_PROYECTO,
  CriterioEticoItem,
  CRITERIOS_ETICOS_INICIALES,
  EtapaProgresoVertical,
  ETAPAS_PROGRESO_VERTICAL,
  SubEtapaAnexoId,
  CriterioNormativaItem,
  CRITERIOS_NORMATIVA_INICIALES,
  RecomendacionComiteState,
  DEFAULT_RECOMENDACION_COMITE,
  FirmaEvaluadorState,
  DEFAULT_FIRMA_EVALUADOR,
  DictamenComite,
} from '../../features/evaluacion/models';

@Injectable({
  providedIn: 'root',
})
export class EvaluacionService {
  private readonly http = inject(HttpClient);
  readonly sessionService = inject(EvaluationSessionService);
  private readonly apiUrl = 'http://localhost:3000/api/v1';
  // 1. Estado de pasos horizontales del wizard superior
  private readonly _steps = signal<StepItem[]>(EVALUACION_STEPS);
  private readonly _currentStep = signal<StepEvaluacionId>('datos-generales');

  // 2. Estado Paso 1: Datos Generales
  private readonly _datosGenerales = signal<DatosGeneralesProyecto>({
    ...DEFAULT_DATOS_GENERALES,
  });

  // 3. Estado Paso 2: Expediente
  private readonly _documentosExpediente = signal<DocumentoExpedienteItem[]>([
    ...DEFAULT_EXPEDIENTE_PROYECTO.documentos,
  ]);
  private readonly _codigoExpediente = signal<string>(
    DEFAULT_EXPEDIENTE_PROYECTO.codigoExpediente
  );

  // 4. Estado Paso 3: Anexo y sus 3 sub-vistas
  private readonly _subEtapaAnexo = signal<SubEtapaAnexoId>('principios-eticos');

  // 4.1 Principios Éticos (5 criterios)
  private readonly _criteriosEticos = signal<CriterioEticoItem[]>([
    ...CRITERIOS_ETICOS_INICIALES,
  ]);

  // 4.2 Cumplimiento de Normativa Legal (4 normativas)
  private readonly _criteriosNormativa = signal<CriterioNormativaItem[]>([
    ...CRITERIOS_NORMATIVA_INICIALES,
  ]);

  // 4.3 Recomendaciones del Comité
  private readonly _recomendacionComite = signal<RecomendacionComiteState>({
    ...DEFAULT_RECOMENDACION_COMITE,
  });

  // 4.4 Firma Digital
  private readonly _firmaEvaluador = signal<FirmaEvaluadorState>({
    ...DEFAULT_FIRMA_EVALUADOR,
  });

  // 4.5 Stepper vertical lateral
  private readonly _etapasProgresoVertical = signal<EtapaProgresoVertical[]>([
    ...ETAPAS_PROGRESO_VERTICAL,
  ]);

  // 5. Estado de Evaluación Finalizada en Resumen (Vista de 5 segundos)
  private readonly _evaluacionEnviada = signal<boolean>(false);

  // 6. Declaración jurada de autoría y no uso de IA generativa (Paso 4: Resumen)
  private readonly _declaracionNoIa = signal<boolean>(false);

  // Signals públicas de solo lectura
  readonly steps = this._steps.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly datosGenerales = this._datosGenerales.asReadonly();
  readonly documentosExpediente = this._documentosExpediente.asReadonly();
  readonly codigoExpediente = this._codigoExpediente.asReadonly();
  readonly subEtapaAnexo = this._subEtapaAnexo.asReadonly();
  readonly criteriosEticos = this._criteriosEticos.asReadonly();
  readonly criteriosNormativa = this._criteriosNormativa.asReadonly();
  readonly recomendacionComite = this._recomendacionComite.asReadonly();
  readonly firmaEvaluador = this._firmaEvaluador.asReadonly();
  readonly etapasProgresoVertical = this._etapasProgresoVertical.asReadonly();
  readonly evaluacionEnviada = this._evaluacionEnviada.asReadonly();
  readonly declaracionNoIa = this._declaracionNoIa.asReadonly();

  readonly anexoFirmado = computed(() => !!this._firmaEvaluador().firmado);

  readonly activeStepItem = computed(() =>
    this._steps().find((s) => s.id === this._currentStep())
  );

  // ==========================================
  // COMPUTED: Métricas y contadores en tiempo real
  // ==========================================
  readonly totalCriterios = computed(() => {
    return this._criteriosEticos().length + this._criteriosNormativa().length;
  });

  readonly totalCumple = computed(() => {
    const eticos = this._criteriosEticos().filter((c) => c.cumplimiento === 'cumple').length;
    const legales = this._criteriosNormativa().filter((c) => c.cumplimiento === 'cumple').length;
    return eticos + legales;
  });

  readonly totalNoCumple = computed(() => {
    const eticos = this._criteriosEticos().filter((c) => c.cumplimiento === 'no_cumple').length;
    const legales = this._criteriosNormativa().filter((c) => c.cumplimiento === 'no_cumple').length;
    return eticos + legales;
  });

  readonly totalPendientes = computed(() => {
    const eticos = this._criteriosEticos().filter((c) => c.cumplimiento === null).length;
    const legales = this._criteriosNormativa().filter((c) => c.cumplimiento === null).length;
    return eticos + legales;
  });

  readonly evaluacionCompleta = computed(() => {
    return this.totalPendientes() === 0 && !!this._firmaEvaluador().firmado;
  });

  // ==========================================
  // Navegación entre pasos principales (Wizard)
  // ==========================================
  setStep(stepId: StepEvaluacionId): void {
    this._currentStep.set(stepId);
    this._steps.update((steps) =>
      steps.map((step) => ({
        ...step,
        active: step.id === stepId,
      }))
    );
    // Si vuelve a la pestaña Anexo y ya estaba firmado, mantener todos los hitos completados
    if (stepId === 'anexo' && this.anexoFirmado()) {
      this._etapasProgresoVertical.update((etapas) =>
        etapas.map((etapa) => ({ ...etapa, estado: 'completado' }))
      );
    }
  }

  nextStep(): void {
    const ordenPasos: StepEvaluacionId[] = ['datos-generales', 'expediente', 'anexo', 'resumen'];
    const currentIndex = ordenPasos.indexOf(this._currentStep());
    if (currentIndex < ordenPasos.length - 1) {
      this.setStep(ordenPasos[currentIndex + 1]);
    }
  }

  prevStep(): void {
    const ordenPasos: StepEvaluacionId[] = ['datos-generales', 'expediente', 'anexo', 'resumen'];
    const currentIndex = ordenPasos.indexOf(this._currentStep());
    if (currentIndex > 0) {
      this.setStep(ordenPasos[currentIndex - 1]);
    }
  }

  // ==========================================
  // Navegación entre sub-etapas del Anexo
  // ==========================================
  setSubEtapaAnexo(subEtapa: SubEtapaAnexoId): void {
    this._subEtapaAnexo.set(subEtapa);
    this.sincronizarStepperVertical(subEtapa);
  }

  avanzarSubEtapaAnexo(): void {
    const orden: SubEtapaAnexoId[] = ['principios-eticos', 'normativa-legal', 'firmar'];
    const index = orden.indexOf(this._subEtapaAnexo());
    if (index < orden.length - 1) {
      this.setSubEtapaAnexo(orden[index + 1]);
    } else {
      // Al terminar la última sub-etapa de Anexo ('firmar'), avanzamos al paso Resumen
      this.setStep('resumen');
    }
  }

  retrocederSubEtapaAnexo(): void {
    const orden: SubEtapaAnexoId[] = ['principios-eticos', 'normativa-legal', 'firmar'];
    const index = orden.indexOf(this._subEtapaAnexo());
    if (index > 0) {
      this.setSubEtapaAnexo(orden[index - 1]);
    } else {
      // Si estamos en la primera sub-etapa de Anexo y retrocedemos, volvemos a Expediente
      this.setStep('expediente');
    }
  }

  private sincronizarStepperVertical(subEtapaActiva: SubEtapaAnexoId): void {
    const yaFirmado = !!this._firmaEvaluador().firmado;
    this._etapasProgresoVertical.update((etapas) =>
      etapas.map((etapa) => {
        if (yaFirmado) {
          return { ...etapa, estado: 'completado' };
        }
        if (etapa.id === 'eval-anexo-9') {
          return { ...etapa, estado: 'completado' };
        }
        if (etapa.id === 'principios-eticos') {
          if (subEtapaActiva === 'principios-eticos') return { ...etapa, estado: 'activo' };
          return { ...etapa, estado: 'completado' };
        }
        if (etapa.id === 'normativa-legal') {
          if (subEtapaActiva === 'principios-eticos') return { ...etapa, estado: 'pendiente' };
          if (subEtapaActiva === 'normativa-legal') return { ...etapa, estado: 'activo' };
          return { ...etapa, estado: 'completado' };
        }
        if (etapa.id === 'firmar') {
          if (subEtapaActiva === 'firmar') {
            return {
              ...etapa,
              estado: this._firmaEvaluador().firmado ? 'completado' : 'activo',
            };
          }
          return { ...etapa, estado: 'pendiente' };
        }
        return etapa;
      })
    );
  }

  // ==========================================
  // Actualización de estados
  // ==========================================
  updateDatosGenerales(nuevosDatos: DatosGeneralesProyecto): void {
    this._datosGenerales.set({ ...nuevosDatos });
  }

  updateDocumentosExpediente(docs: DocumentoExpedienteItem[]): void {
    this._documentosExpediente.set([...docs]);
  }

  updateCriteriosEticos(criterios: CriterioEticoItem[]): void {
    this._criteriosEticos.set([...criterios]);
  }

  updateCriteriosNormativa(criterios: CriterioNormativaItem[]): void {
    this._criteriosNormativa.set([...criterios]);
  }

  updateRecomendacionComite(data: Partial<RecomendacionComiteState>): void {
    this._recomendacionComite.update((current) => ({
      ...current,
      ...data,
    }));
  }

  updateFirmaEvaluador(data: Partial<FirmaEvaluadorState>): void {
    this._firmaEvaluador.update((current) => {
      const updated = { ...current, ...data };
      return updated;
    });
    if (data.firmado !== undefined) {
      this.sincronizarStepperVertical(this._subEtapaAnexo());
      if (data.firmado) {
        this._documentosExpediente.update((docs) =>
          docs.map((d) =>
            d.id === 'anexo'
              ? { ...d, estado: 'recibido', estadoLabel: 'Firmado' }
              : d
          )
        );
      }
    }
  }

  marcarEvaluacionEnviada(valor: boolean): void {
    this._evaluacionEnviada.set(valor);
  }

  setDeclaracionNoIa(valor: boolean): void {
    this._declaracionNoIa.set(valor);
  }

  redirigirAHomeView2(evaluacionId?: string): void {
    this.sessionService.limpiarSesion();
    if (typeof window !== 'undefined') {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: 'EVALUACION_FINALIZADA', evaluacionId },
          '*'
        );
      }
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = 'http://localhost:3001/homeview2';
        } else {
          window.location.href = 'http://localhost:3001/homeview2';
        }
      } catch {
        window.location.href = 'http://localhost:3001/homeview2';
      }
    }
  }

  constructor() {
    let expId = this.sessionService.expedienteId();
    if (!expId && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      expId = urlParams.get('expedienteId') || urlParams.get('id');
    }
    // Fallback defensivo para desarrollo / visualización directa
    if (!expId) {
      expId = 'EXP-2026-0012';
    }
    if (expId) {
      this.cargarExpediente(expId);
      this.cargarEstadoAnexo(expId);
    }
  }

  /**
   * Consume el endpoint que recupera todo del expediente:
   * GET /api/v1/expedientes/:id
   */
  cargarExpediente(expedienteId: string): void {
    this.http.get<any>(`${this.apiUrl}/expedientes/${expedienteId}`).subscribe({
      next: (data) => {
        const ticket = data.ticket || data;
        if (data.codigo || ticket.codigo) {
          this._codigoExpediente.set(data.codigo || ticket.codigo);
        }
        const tipoInvestigacionTexto =
          ticket.tipoInvestigacion && ticket.tipoInvestigacionOtro
            ? `${ticket.tipoInvestigacion}: ${ticket.tipoInvestigacionOtro}`
            : ticket.tipoInvestigacion || 'Investigación Aplicada';

        const financiamientoTexto =
          ticket.financiamiento && ticket.financiamientoDetalle
            ? `${ticket.financiamiento}: ${ticket.financiamientoDetalle}`
            : ticket.financiamiento || 'Recursos Propios';

        this._datosGenerales.set({
          tituloProyecto: ticket.titulo || '',
          investigadoresResponsables:
            Array.isArray(ticket.investigadores) && ticket.investigadores.length > 0
              ? ticket.investigadores.join(', ')
              : 'No asignado',
          unidadAcademicaFacultad: ticket.unidadAcademica || 'Facultad no especificada',
          tipoInvestigacion: tipoInvestigacionTexto,
          fechaPresentacion: ticket.fechaPresentacion
            ? new Date(ticket.fechaPresentacion).toLocaleDateString('es-PE', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : 'Pendiente',
          financiamiento: financiamientoTexto,
        });

        // Construir la lista de documentos reales a partir de los archivos del ticket
        const docs: DocumentoExpedienteItem[] = [];

        const documentosAdjuntos =
          Array.isArray(data.documentos) && data.documentos.length > 0
            ? data.documentos
            : Array.isArray(ticket.documentos)
              ? ticket.documentos
              : [];

        const token =
          this.sessionService.accessToken() ||
          this.sessionService.token() ||
          '';
        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

        // Buscar coincidencia entre campos de texto y documentos adjuntos reales
        const buscarDocAdjunto = (valor: string | string[] | undefined) => {
          if (!valor) return undefined;
          const nombres = Array.isArray(valor) ? valor : [valor];
          for (const nom of nombres) {
            const limpio = String(nom).trim().toLowerCase();
            const encontrado = documentosAdjuntos.find((d: any) => {
              const dNom = (d.nombreOriginal || d.nombre || '').toLowerCase();
              return dNom && (dNom === limpio || dNom.includes(limpio) || limpio.includes(dNom));
            });
            if (encontrado) return encontrado;
          }
          return undefined;
        };

        const idsAgregados = new Set<string>();

        if (ticket.participantes) {
          const partLabel = Array.isArray(ticket.participantes)
            ? ticket.participantes.join(', ')
            : ticket.participantes;
          const match = buscarDocAdjunto(ticket.participantes);
          if (match?.id) idsAgregados.add(match.id);
          const rawName = Array.isArray(ticket.participantes) ? ticket.participantes[0] : ticket.participantes;
          const targetId = match?.id || rawName || 'participantes';
          const docUrl = match?.url || `${this.apiUrl}/documents/${encodeURIComponent(targetId)}/view${tokenParam}`;
          docs.push({
            id: targetId,
            label: `Participantes: ${partLabel}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
            url: docUrl,
            pdfUrl: docUrl,
            tipoDocumental: match?.tipoDocumental,
          });
        }

        if (ticket.naturalezaProyecto) {
          const match = buscarDocAdjunto(ticket.naturalezaProyecto);
          if (match?.id) idsAgregados.add(match.id);
          const targetId = match?.id || ticket.naturalezaProyecto || 'naturaleza-proyecto';
          const docUrl = match?.url || `${this.apiUrl}/documents/${encodeURIComponent(targetId)}/view${tokenParam}`;
          docs.push({
            id: targetId,
            label: `Naturaleza del Proyecto: ${ticket.naturalezaProyecto}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
            url: docUrl,
            pdfUrl: docUrl,
            tipoDocumental: match?.tipoDocumental,
          });
        }

        if (ticket.modalidad) {
          const match = buscarDocAdjunto(ticket.modalidad);
          if (match?.id) idsAgregados.add(match.id);
          const targetId = match?.id || ticket.modalidad || 'modalidad';
          const docUrl = match?.url || `${this.apiUrl}/documents/${encodeURIComponent(targetId)}/view${tokenParam}`;
          docs.push({
            id: targetId,
            label: `Modalidad: ${ticket.modalidad}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
            url: docUrl,
            pdfUrl: docUrl,
            tipoDocumental: match?.tipoDocumental,
          });
        }

        if (ticket.planProyecto) {
          const match = buscarDocAdjunto(ticket.planProyecto);
          if (match?.id) idsAgregados.add(match.id);
          const targetId = match?.id || ticket.planProyecto || 'plan-proyecto';
          const docUrl = match?.url || `${this.apiUrl}/documents/${encodeURIComponent(targetId)}/view${tokenParam}`;
          docs.push({
            id: targetId,
            label: `Plan de Proyecto: ${ticket.planProyecto}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
            url: docUrl,
            pdfUrl: docUrl,
            tipoDocumental: match?.tipoDocumental,
          });
        }

        if (documentosAdjuntos.length > 0) {
          for (const d of documentosAdjuntos) {
            if (idsAgregados.has(d.id)) continue;
            idsAgregados.add(d.id);
            const nombreDoc = d.nombre || d.nombreOriginal || 'Documento adjunto';
            const prefijoTipo =
              d.tipoDocumental === 'AUDIO_ASUNTO'
                ? 'Audio de Asunto: '
                : d.tipoDocumental?.startsWith('ANEXO_ASUNTO')
                  ? 'Anexo de Asunto: '
                  : '';
            const docUrl = d.url || `${this.apiUrl}/documents/${d.id}/view${tokenParam}`;
            docs.push({
              id: d.id,
              label: `${prefijoTipo}${nombreDoc}`,
              estado: 'recibido',
              estadoLabel: 'Recibido',
              url: docUrl,
              pdfUrl: docUrl,
              tipoDocumental: d.tipoDocumental,
            });
          }
        }

        // Fila final del Anexo N°9
        docs.push({
          id: 'anexo',
          label: 'Anexo N°9',
          estado: 'sin_evaluar',
          estadoLabel: 'Aun sin evaluar',
        });

        this._documentosExpediente.set(docs);
      },
      error: (err) => {
        console.warn('[EvaluacionService] Error al cargar expediente desde API, aplicando datos de respaldo:', err);
        const token =
          this.sessionService.accessToken() ||
          this.sessionService.token() ||
          '';
        const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
        this._codigoExpediente.set(expedienteId || 'EXP-2026-0012');
        this._datosGenerales.set({
          tituloProyecto: 'Apple Treeh 56',
          investigadoresResponsables: 'Lucy Jane Fre',
          unidadAcademicaFacultad: 'Facultad de Ciencias e Ingeniería',
          tipoInvestigacion: 'Proyecto de investigación docente',
          fechaPresentacion: '25 de Octubre, 2026',
          financiamiento: 'UNTELS',
        });
        this._documentosExpediente.set([
          {
            id: 'participantes',
            label: 'Participantes: Art Aseguramiento_de_la_Calidad.pdf',
            estado: 'recibido',
            estadoLabel: 'Recibido',
            pdfUrl: `${this.apiUrl}/documents/participantes/view${tokenParam}`,
            url: `${this.apiUrl}/documents/participantes/view${tokenParam}`,
          },
          {
            id: 'naturaleza-proyecto',
            label: 'Naturaleza del Proyecto: Tarea4_Equipo2.pdf',
            estado: 'recibido',
            estadoLabel: 'Recibido',
            pdfUrl: `${this.apiUrl}/documents/naturaleza-proyecto/view${tokenParam}`,
            url: `${this.apiUrl}/documents/naturaleza-proyecto/view${tokenParam}`,
          },
          {
            id: 'modalidad',
            label: 'Modalidad: Cuestionario1-1&Digrama.pdf',
            estado: 'recibido',
            estadoLabel: 'Recibido',
            pdfUrl: `${this.apiUrl}/documents/modalidad/view${tokenParam}`,
            url: `${this.apiUrl}/documents/modalidad/view${tokenParam}`,
          },
          {
            id: 'plan-proyecto',
            label: 'Plan de Proyecto: Cuestionario22.pdf',
            estado: 'recibido',
            estadoLabel: 'Recibido',
            pdfUrl: `${this.apiUrl}/documents/plan-proyecto/view${tokenParam}`,
            url: `${this.apiUrl}/documents/plan-proyecto/view${tokenParam}`,
          },
          {
            id: 'cmvn3p8rs000eecs4tkmnmrd9',
            label: 'Anexo de Asunto: lagu-sans (1).zip',
            estado: 'recibido',
            estadoLabel: 'Recibido',
            pdfUrl: `${this.apiUrl}/documents/cmvn3p8rs000eecs4tkmnmrd9/view${tokenParam}`,
            url: `${this.apiUrl}/documents/cmvn3p8rs000eecs4tkmnmrd9/view${tokenParam}`,
          },
          {
            id: 'cmvn3p8r4000decs4a4odwwpu',
            label: 'Audio de Asunto: 2hollis, Shawn Wasabi - Crush x BURNT RICE (Slowed + Reverb) Mashup, Remix [BEST VERSION].mp3',
            estado: 'recibido',
            estadoLabel: 'Recibido',
            pdfUrl: `${this.apiUrl}/documents/cmvn3p8r4000decs4a4odwwpu/view${tokenParam}`,
            url: `${this.apiUrl}/documents/cmvn3p8r4000decs4a4odwwpu/view${tokenParam}`,
          },
          {
            id: 'anexo',
            label: 'Anexo N°9',
            estado: 'sin_evaluar',
            estadoLabel: 'Aun sin evaluar',
          },
        ]);
      },
    });
  }

  /**
   * Consulta si ya existe un borrador previo o versión firmada:
   * GET /api/v1/evaluaciones/anexo/:expedienteId
   */
  cargarEstadoAnexo(expedienteId: string): void {
    this.http.get<any>(`${this.apiUrl}/evaluaciones/anexo/${expedienteId}`).subscribe({
      next: (res) => {
        if (res.soloLectura) {
          this.sessionService.setSoloLectura(true);
        }
        if (res.datos) {
          if (Array.isArray(res.datos.principiosEticos) && res.datos.principiosEticos.length > 0) {
            this._criteriosEticos.update((criterios) =>
              criterios.map((c) => {
                const prev = res.datos.principiosEticos.find((p: any) => p.id === c.id);
                return prev
                  ? {
                      ...c,
                      cumplimiento: prev.cumple ? 'cumple' : 'no_cumple',
                      observaciones: prev.observaciones || '',
                    }
                  : c;
              })
            );
          }
          if (Array.isArray(res.datos.normativaLegal) && res.datos.normativaLegal.length > 0) {
            this._criteriosNormativa.update((criterios) =>
              criterios.map((c) => {
                const prev = res.datos.normativaLegal.find((p: any) => p.id === c.id);
                return prev
                  ? {
                      ...c,
                      cumplimiento: prev.cumple ? 'cumple' : 'no_cumple',
                      observaciones: prev.observaciones || '',
                    }
                  : c;
              })
            );
          }
          if (res.datos.resultado || res.datos.recomendacion) {
            this._recomendacionComite.update((rec) => ({
              ...rec,
              dictamen:
                (res.datos.resultado?.toLowerCase() as DictamenComite) || rec.dictamen,
              observaciones: res.datos.recomendacion || rec.observaciones,
            }));
          }
          if (res.datos.firma) {
            this._firmaEvaluador.update((f) => ({
              ...f,
              firmado: true,
              firmaDataUrl: res.datos.firma.firmaDataUrl || f.firmaDataUrl,
            }));
            this.sincronizarStepperVertical(this._subEtapaAnexo());
          }
        }
      },
      error: (err) => {
        console.warn('[EvaluacionService] Error al cargar estado del anexo:', err);
      },
    });
  }

  /**
   * Asegura que exista un token de evaluación contextual antes de enviar.
   * Si falta el token en sesión pero hay JWT de usuario, lo solicita automáticamente.
   */
  private asegurarTokenEvaluacion(expedienteId: string): Observable<string | null> {
    const tokenActual = this.sessionService.token();
    if (tokenActual) {
      return of(tokenActual);
    }

    return this.http
      .post<any>(`${this.apiUrl}/evaluaciones/tokens`, { expedienteId })
      .pipe(
        tap((res) => {
          if (res?.token) {
            this.sessionService.setToken(res.token);
          }
          if (res?.expedienteId) {
            this.sessionService.setExpedienteId(res.expedienteId);
          }
        }),
        switchMap((res) => of(res?.token || null)),
        catchError((err) => {
          console.warn('[EvaluacionService] No se pudo generar token contextual automático:', err);
          return of(null);
        })
      );
  }

  /**
   * Finaliza y firma la evaluación enviando las 5 secciones al backend:
   * POST /api/v1/evaluaciones/anexo/completar
   */
  completarEvaluacionApi() {
    const expedienteId =
      this.sessionService.expedienteId() || this._codigoExpediente();
    const payload = {
      expedienteId,
      principiosEticos: this._criteriosEticos().map((c) => ({
        id: c.id,
        cumple: c.cumplimiento === 'cumple',
        observaciones: c.observaciones || '',
      })),
      metodologiaRiesgos: [
        {
          id: 'medida-seguridad-laboratorio',
          cumple:
            this._criteriosEticos().find(
              (c) => c.id === 'medida-seguridad-laboratorio'
            )?.cumplimiento === 'cumple',
          observaciones:
            this._criteriosEticos().find(
              (c) => c.id === 'medida-seguridad-laboratorio'
            )?.observaciones || '',
        },
      ],
      normativaLegal: this._criteriosNormativa().map((c) => ({
        id: c.id,
        cumple: c.cumplimiento === 'cumple',
        observaciones: c.observaciones || '',
      })),
      dictamen: this._recomendacionComite().dictamen,
      observacionesGenerales: this._recomendacionComite().observaciones,
      declaracionNoIa: this._declaracionNoIa(),
      firma: {
        firmaDataUrl:
          this._firmaEvaluador().firmaDataUrl ||
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        firmadoEn: new Date().toISOString(),
        declaracionAceptada: true,
      },
    };

    return this.asegurarTokenEvaluacion(expedienteId).pipe(
      switchMap((token) => {
        const tokenFinal = token || this.sessionService.token();
        if (!tokenFinal) {
          throw new Error(
            'Token de evaluación contextual ausente. Por favor, refresque la página para sincronizar la sesión.'
          );
        }
        return this.http.post<any>(
          `${this.apiUrl}/evaluaciones/anexo/completar`,
          payload
        );
      })
    );
  }

  /**
   * Cancela la evaluación, revoca el token en el backend y redirige de inmediato a la tabla principal (/homeview2)
   * Sin mutar el stepper interno a 'datos-generales' para evitar que la UI retroceda visualmente antes de salir.
   */
  cancelarEvaluacionApi() {
    const token = this.sessionService.token();
    if (token) {
      this.http
        .post(`${this.apiUrl}/evaluaciones/tokens/revocar`, {
          token,
          motivo: 'Cancelado por el evaluador desde el formulario de Anexo',
        })
        .subscribe({
          next: () => console.log('[EvaluacionService] Token de evaluación revocado exitosamente.'),
          error: (err) => console.warn('[EvaluacionService] Error al revocar token:', err),
        });
    }

    this.sessionService.limpiarSesion();

    if (typeof window !== 'undefined') {
      // 1. Notificar al contenedor del Shell mediante postMessage de forma inmediata
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'EVALUACION_CANCELADA' }, '*');
      }
      // 2. Redirección directa hacia la tabla principal del Shell (puerto 3001)
      try {
        if (window.top && window.top !== window) {
          window.top.location.href = 'http://localhost:3001/homeview2';
        } else {
          window.location.href = 'http://localhost:3001/homeview2';
        }
      } catch (e) {
        // En caso de bloqueo por sandbox cross-origin, postMessage al parent se encarga
        window.location.href = 'http://localhost:3001/homeview2';
      }
    }
  }

  reset(): void {
    this._currentStep.set('datos-generales');
    this._subEtapaAnexo.set('principios-eticos');
    this._datosGenerales.set({ ...DEFAULT_DATOS_GENERALES });
    this._documentosExpediente.set([...DEFAULT_EXPEDIENTE_PROYECTO.documentos]);
    this._criteriosEticos.set([...CRITERIOS_ETICOS_INICIALES]);
    this._criteriosNormativa.set([...CRITERIOS_NORMATIVA_INICIALES]);
    this._recomendacionComite.set({ ...DEFAULT_RECOMENDACION_COMITE });
    this._firmaEvaluador.set({ ...DEFAULT_FIRMA_EVALUADOR });
    this._steps.set(EVALUACION_STEPS);
    this._etapasProgresoVertical.set([...ETAPAS_PROGRESO_VERTICAL]);
    this._evaluacionEnviada.set(false);
    this._declaracionNoIa.set(false);
  }
}
