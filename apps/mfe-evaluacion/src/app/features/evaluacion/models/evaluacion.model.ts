import { DatosGeneralesProyecto, DEFAULT_DATOS_GENERALES } from './datos-generales.model';

export type StepEvaluacionId = 'datos-generales' | 'expediente' | 'anexo' | 'resumen';

export interface StepItem {
  id: StepEvaluacionId;
  label: string;
  active: boolean;
  disabled: boolean;
}

export interface EvaluacionExpedienteState {
  idExpediente?: string;
  currentStep: StepEvaluacionId;
  datosGenerales: DatosGeneralesProyecto;
}

export const INITIAL_EVALUACION_STATE: EvaluacionExpedienteState = {
  idExpediente: 'EXP-2026-001',
  currentStep: 'datos-generales',
  datosGenerales: DEFAULT_DATOS_GENERALES,
};

export const EVALUACION_STEPS: StepItem[] = [
  {
    id: 'datos-generales',
    label: 'DATOS GENERALES DEL PROYECTO',
    active: true,
    disabled: false,
  },
  {
    id: 'expediente',
    label: 'EXPEDIENTE',
    active: false,
    disabled: false,
  },
  {
    id: 'anexo',
    label: 'ANEXO',
    active: false,
    disabled: false,
  },
  {
    id: 'resumen',
    label: 'RESUMEN',
    active: false,
    disabled: false,
  },
];
