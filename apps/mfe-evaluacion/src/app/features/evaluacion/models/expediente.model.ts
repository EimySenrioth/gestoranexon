export type EstadoDocumentoExpediente = 'recibido' | 'sin_evaluar' | 'pendiente';

export interface DocumentoExpedienteItem {
  id: string;
  label: string;
  estado: EstadoDocumentoExpediente;
  estadoLabel: string;
}

export interface ExpedienteProyecto {
  codigoExpediente: string;
  documentos: DocumentoExpedienteItem[];
}

export const MOCK_DOCUMENTOS_EXPEDIENTE: DocumentoExpedienteItem[] = [
  {
    id: 'participantes',
    label: 'Participantes',
    estado: 'recibido',
    estadoLabel: 'Recibido',
  },
  {
    id: 'naturaleza-proyecto',
    label: 'Naturaleza del Proyecto',
    estado: 'recibido',
    estadoLabel: 'Recibido',
  },
  {
    id: 'financiamiento',
    label: 'Financiamiento',
    estado: 'recibido',
    estadoLabel: 'Recibido',
  },
  {
    id: 'plan-proyecto',
    label: 'Plan de Proyecto',
    estado: 'recibido',
    estadoLabel: 'Recibido',
  },
  {
    id: 'anexo',
    label: 'Anexo',
    estado: 'sin_evaluar',
    estadoLabel: 'Aun sin evaluar',
  },
];

export const DEFAULT_EXPEDIENTE_PROYECTO: ExpedienteProyecto = {
  codigoExpediente: 'EXP-2026-001',
  documentos: MOCK_DOCUMENTOS_EXPEDIENTE,
};
