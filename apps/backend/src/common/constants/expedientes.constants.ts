export const DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS = [
  'NATURALEZA_PROYECTO',
  'PARTICIPANTES',
  'MODALIDAD',
  'PLAN_PROYECTO',
] as const;

export type DocumentoExpedienteObligatorio =
  (typeof DOCUMENTOS_EXPEDIENTE_OBLIGATORIOS)[number];

export const TIPO_SOLICITUD_DEFAULT = 'NA';
export const TIPOS_SOLICITUD_PERMITIDOS = ['NA'] as const;

export const TIPO_DOC_AUDIO_ASUNTO = 'AUDIO_ASUNTO';
export const PREFIJO_ANEXO_ASUNTO = 'ANEXO_ASUNTO_';

// Audio rules
export const MIME_AUDIO_PERMITIDOS = ['audio/mpeg', 'audio/mp3'];
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB

// Attachments rules (Office / PDF / ZIP)
export const MIME_DOCUMENTOS_PERMITIDOS = [
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip', // .zip
  'application/x-zip-compressed',
  'multipart/x-zip',
];

export const EXTENSIONES_DOCUMENTOS_PERMITIDAS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.zip',
];

export const EXTENSIONES_PROHIBIDAS = [
  '.exe',
  '.bat',
  '.cmd',
  '.msi',
  '.sh',
  '.bin',
  '.js',
  '.mjs',
  '.ts',
  '.php',
  '.html',
  '.htm',
  '.vbs',
  '.rar',
  '.7z',
  '.tar',
  '.gz',
];

export const MAX_ANEXO_INDIVIDUAL_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_TOTAL_ANEXOS_BYTES = 50 * 1024 * 1024; // 50 MB
export const MAX_CANTIDAD_ANEXOS = 5;

