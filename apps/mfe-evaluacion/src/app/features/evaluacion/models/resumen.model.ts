export type TipoResumenVista = 'expediente' | 'anexo';

export interface DocumentoResumenItem {
  id: string;
  nombre: string;
  editable: boolean;
}

export const DOCUMENTOS_RESUMEN_INICIALES: DocumentoResumenItem[] = [
  { id: 'participantes', nombre: 'Participantes', editable: true },
  { id: 'naturaleza', nombre: 'Naturaleza del Proyecto', editable: true },
  { id: 'financiamiento', nombre: 'Financiamiento', editable: true },
  { id: 'plan-proyecto', nombre: 'Plan de Proyecto', editable: true },
  { id: 'anexo', nombre: 'Anexo', editable: true },
];

export interface FilaResumenEtica {
  principio: string;
  cumple: 'Si' | 'No' | '';
  noCumple: 'Si' | 'No' | '';
  observaciones: string;
}
