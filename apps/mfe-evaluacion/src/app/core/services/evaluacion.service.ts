import { Injectable, signal, computed } from '@angular/core';
import {
  StepEvaluacionId,
  StepItem,
  EVALUACION_STEPS,
  DatosGeneralesProyecto,
  DEFAULT_DATOS_GENERALES,
} from '../../features/evaluacion/models';

@Injectable({
  providedIn: 'root',
})
export class EvaluacionService {
  private readonly _steps = signal<StepItem[]>(EVALUACION_STEPS);
  private readonly _currentStep = signal<StepEvaluacionId>('datos-generales');
  private readonly _datosGenerales = signal<DatosGeneralesProyecto>({
    ...DEFAULT_DATOS_GENERALES,
  });

  // Getters públicos como signals de solo lectura
  readonly steps = this._steps.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly datosGenerales = this._datosGenerales.asReadonly();

  // Computado del paso actual activo
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
   * Actualiza los datos generales del proyecto
   */
  updateDatosGenerales(nuevosDatos: DatosGeneralesProyecto): void {
    this._datosGenerales.set({ ...nuevosDatos });
  }

  /**
   * Parchea parcialmente campos de datos generales
   */
  patchDatosGenerales(parcial: Partial<DatosGeneralesProyecto>): void {
    this._datosGenerales.update((prev) => ({
      ...prev,
      ...parcial,
    }));
  }

  /**
   * Reinicia al estado inicial
   */
  reset(): void {
    this._currentStep.set('datos-generales');
    this._datosGenerales.set({ ...DEFAULT_DATOS_GENERALES });
    this._steps.set(EVALUACION_STEPS);
  }
}
