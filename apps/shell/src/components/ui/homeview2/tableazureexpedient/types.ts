export type EtapaEvaluacion = "En evaluación" | "Evaluado" | "Observado";

export interface SolicitudFirmaItem {
  id: string;
  fechaSolicitud: string;
  fechaEvaluacion: string;
  etapaActual: EtapaEvaluacion;
  evaluar: {
    firmado: boolean;
    fechaFirma?: string;
  };
}
