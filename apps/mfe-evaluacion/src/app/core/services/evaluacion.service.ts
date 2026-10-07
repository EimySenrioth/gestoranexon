import { Injectable, signal, computed } from '@angular/core';
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
    const ordenPasos: StepEvaluacionId[] = ['datos-generales', 'expediente', 'anexo'];
    const currentIndex = ordenPasos.indexOf(this._currentStep());
    if (currentIndex < ordenPasos.length - 1) {
      this.setStep(ordenPasos[currentIndex + 1]);
    }
  }

  prevStep(): void {
    const ordenPasos: StepEvaluacionId[] = ['datos-generales', 'expediente', 'anexo'];
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
