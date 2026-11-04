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

export interface EvaluacionFinalizadaState {
  evaluacionId?: string;
  dictamen?: string;
  firmadoEn?: string;
  declaracionNoIa?: boolean;
}

export const TEXTO_DECLARACION_NO_IA =
  'Declaro que la presente evaluación y el correspondiente informe de revisión fueron elaborados íntegramente por mí, con base en mi propio análisis, criterio académico y valoración crítica del documento. Asimismo, hago constar que no utilicé herramientas de inteligencia artificial generativa ni tecnologías asistidas por IA en ninguna etapa del proceso de evaluación, análisis o redacción del informe. Las observaciones, comentarios y recomendaciones expresados son resultado exclusivo de mi juicio y trabajo intelectual.';
