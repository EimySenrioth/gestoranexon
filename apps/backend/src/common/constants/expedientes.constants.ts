export const DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS = [
  'NATURALEZA_PROYECTO',
  'PARTICIPANTES',
  'MODALIDAD',
  'PLAN_PROYECTO',
] as const;

export type DocumentoExpedienteObligatorio =
  (typeof DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS)[number];
