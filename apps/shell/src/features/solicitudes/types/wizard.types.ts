export type WizardStepId = "datos-generales" | "expediente" | "revisar" | "envio";

export interface WizardStep {
  id: WizardStepId;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface DatosGeneralesFormData {
  titulo: string;
  investigadores: string[];
  unidadAcademica: string;
  tipoInvestigacion?: string;
  tipoInvestigacionOtro?: string;
  financiamiento: string;
  financiamientoDetalle?: string;
}

export interface ExpedienteFormData {
  naturalezaProyecto: string;
  participantes: string[];
  modalidad: string;
  planProyecto: string;
  codigoSolicitante?: string;
  codigo?: string; // Mantener por compatibilidad interna
  expedienteUid: string;
}

export interface SolicitudCompletaData {
  datosGenerales: DatosGeneralesFormData;
  expediente: ExpedienteFormData;
}
