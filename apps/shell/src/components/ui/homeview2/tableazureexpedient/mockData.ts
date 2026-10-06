import { SolicitudFirmaItem } from "./types";

export const MOCK_SOLICITUDES_FIRMA: SolicitudFirmaItem[] = [
  {
    id: "UID Solicitud",
    fechaSolicitud: "9/26/2026",
    fechaEvaluacion: "9/26/2026",
    etapaActual: "En evaluación",
    evaluar: {
      firmado: false,
    },
  },
  {
    id: "UID Solicitud",
    fechaSolicitud: "9/26/2026",
    fechaEvaluacion: "9/23/2026",
    etapaActual: "Evaluado",
    evaluar: {
      firmado: true,
      fechaFirma: "9/23/2026",
    },
  },
];
