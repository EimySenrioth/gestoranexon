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
} from '../../features/evaluacion/models';

@Injectable({
  providedIn: 'root',
})
export class EvaluacionService {
  // 1. Estado de pasos horizontales del wizard
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

  // 4. Estado Paso 3: Evaluación Ética y Barra Vertical
  private readonly _criteriosEticos = signal<CriterioEticoItem[]>([
    ...CRITERIOS_ETICOS_INICIALES,
  ]);
  private readonly _etapasProgresoVertical = signal<EtapaProgresoVertical[]>([
    ...ETAPAS_PROGRESO_VERTICAL,
  ]);

  // Readonly signals públicas
  readonly steps = this._steps.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly datosGenerales = this._datosGenerales.asReadonly();
  readonly documentosExpediente = this._documentosExpediente.asReadonly();
  readonly codigoExpediente = this._codigoExpediente.asReadonly();
  readonly criteriosEticos = this._criteriosEticos.asReadonly();
  readonly etapasProgresoVertical = this._etapasProgresoVertical.asReadonly();

  readonly activeStepItem = computed(() =>
    this._steps().find((s) => s.id === this._currentStep())
  );

  /**
   * Cambia el paso activo del wizard
   */
  setStep(stepId: StepEvaluacionId): void {
    this._currentStep.set(stepId);
    this._steps.update((steps) =>
      steps.map((step) => ({
        ...step,
        active: step.id === stepId,
      }))
    );
  }

  /**
   * Avanza al siguiente paso disponible
   */
  nextStep(): void {
    const ordenPasos: StepEvaluacionId[] = ['datos-generales', 'expediente', 'anexo'];
    const currentIndex = ordenPasos.indexOf(this._currentStep());
    if (currentIndex < ordenPasos.length - 1) {
      this.setStep(ordenPasos[currentIndex + 1]);
    }
  }

  /**
   * Retrocede al paso anterior
   */
  prevStep(): void {
    const ordenPasos: StepEvaluacionId[] = ['datos-generales', 'expediente', 'anexo'];
    const currentIndex = ordenPasos.indexOf(this._currentStep());
    if (currentIndex > 0) {
      this.setStep(ordenPasos[currentIndex - 1]);
    }
  }

  /**
   * Actualiza datos generales
   */
  updateDatosGenerales(nuevosDatos: DatosGeneralesProyecto): void {
    this._datosGenerales.set({ ...nuevosDatos });
  }

  /**
   * Actualiza criterios de evaluación ética
   */
  updateCriteriosEticos(criterios: CriterioEticoItem[]): void {
    this._criteriosEticos.set([...criterios]);
  }

  /**
   * Actualiza documentos del expediente
   */
  updateDocumentosExpediente(docs: DocumentoExpedienteItem[]): void {
    this._documentosExpediente.set([...docs]);
  }

  /**
   * Reinicia al estado inicial
   */
  reset(): void {
    this._currentStep.set('datos-generales');
    this._datosGenerales.set({ ...DEFAULT_DATOS_GENERALES });
    this._documentosExpediente.set([...DEFAULT_EXPEDIENTE_PROYECTO.documentos]);
    this._criteriosEticos.set([...CRITERIOS_ETICOS_INICIALES]);
    this._steps.set(EVALUACION_STEPS);
  }
}
