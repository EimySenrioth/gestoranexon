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
    this._etapasProgresoVertical.update((etapas) =>
      etapas.map((etapa) => {
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
      if (data.firmado !== undefined && this._subEtapaAnexo() === 'firmar') {
        this.sincronizarStepperVertical('firmar');
      }
      return updated;
    });
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

        if (ticket.participantes) {
          const partLabel = Array.isArray(ticket.participantes)
            ? ticket.participantes.join(', ')
            : ticket.participantes;
          docs.push({
            id: 'participantes',
            label: `Participantes: ${partLabel}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
          });
        }

        if (ticket.naturalezaProyecto) {
          docs.push({
            id: 'naturaleza-proyecto',
            label: `Naturaleza del Proyecto: ${ticket.naturalezaProyecto}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
          });
        }

        if (ticket.financiamiento) {
          docs.push({
            id: 'financiamiento',
            label: `Financiamiento: ${financiamientoTexto}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
          });
        }

        if (ticket.modalidad) {
          docs.push({
            id: 'modalidad',
            label: `Modalidad: ${ticket.modalidad}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
          });
        }

        if (ticket.planProyecto) {
          docs.push({
            id: 'plan-proyecto',
            label: `Plan de Proyecto: ${ticket.planProyecto}`,
            estado: 'recibido',
            estadoLabel: 'Recibido',
          });
        }

        const documentosAdjuntos =
          Array.isArray(data.documentos) && data.documentos.length > 0
            ? data.documentos
            : Array.isArray(ticket.documentos)
              ? ticket.documentos
              : [];

        if (documentosAdjuntos.length > 0) {
          for (const d of documentosAdjuntos) {
            const nombreDoc = d.nombre || d.nombreOriginal || 'Documento adjunto';
            const prefijoTipo =
              d.tipoDocumental === 'AUDIO_ASUNTO'
                ? 'Audio de Asunto: '
                : d.tipoDocumental?.startsWith('ANEXO_ASUNTO')
                  ? 'Anexo de Asunto: '
                  : '';
            docs.push({
              id: d.id,
              label: `${prefijoTipo}${nombreDoc}`,
              estado: 'recibido',
              estadoLabel: 'Recibido',
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
          },
          {
            id: 'naturaleza-proyecto',
            label: 'Naturaleza del Proyecto: Tarea4_Equipo2.pdf',
            estado: 'recibido',
            estadoLabel: 'Recibido',
          },
          {
            id: 'financiamiento',
            label: 'Financiamiento: UNTELS',
            estado: 'recibido',
            estadoLabel: 'Recibido',
          },
          {
            id: 'modalidad',
            label: 'Modalidad: Cuestionario1-1&Digrama.pdf',
            estado: 'recibido',
            estadoLabel: 'Recibido',
          },
          {
            id: 'plan-proyecto',
            label: 'Plan de Proyecto: Cuestionario22.pdf',
            estado: 'recibido',
            estadoLabel: 'Recibido',
          },
          {
            id: 'cmvn3p8rs000eecs4tkmnmrd9',
            label: 'Anexo de Asunto: lagu-sans (1).zip',
            estado: 'recibido',
            estadoLabel: 'Recibido',
          },
          {
            id: 'cmvn3p8r4000decs4a4odwwpu',
            label: 'Audio de Asunto: 2hollis, Shawn Wasabi - Crush x BURNT RICE (Slowed + Reverb) Mashup, Remix [BEST VERSION].mp3',
            estado: 'recibido',
            estadoLabel: 'Recibido',
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
            }));
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
      firma: {
        firmaDataUrl:
          this._firmaEvaluador().firmaDataUrl ||
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        firmadoEn: new Date().toISOString(),
        declaracionAceptada: true,
      },
    };

    return this.asegurarTokenEvaluacion(expedienteId).pipe(
      switchMap(() =>
        this.http.post<any>(
          `${this.apiUrl}/evaluaciones/anexo/completar`,
          payload
        )
      )
    );
  }

  /**
   * Cancela la evaluación, revoca el token en el backend y redirige a la tabla principal (/homeview2)
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
    this.reset();
    this.sessionService.limpiarSesion();

    if (typeof window !== 'undefined') {
      // 1. Notificar al contenedor del Shell mediante postMessage
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
  }
}
