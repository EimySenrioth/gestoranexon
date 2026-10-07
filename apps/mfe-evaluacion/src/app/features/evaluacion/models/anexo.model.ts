export type ValorCumplimiento = 'cumple' | 'no_cumple' | null;

export interface CriterioEticoItem {
  id: string;
  titulo: string;
  descripcionAyuda: string;
  cumplimiento: ValorCumplimiento;
  observaciones: string;
  mostrarAyuda?: boolean;
}

export type EstadoEtapaProgreso = 'completado' | 'activo' | 'pendiente';

export type SubEtapaAnexoId = 'principios-eticos' | 'normativa-legal' | 'firmar';

export interface EtapaProgresoVertical {
  id: string;
  titulo: string;
  tipoIcono: 'sobre' | 'portapapeles' | 'avion';
  estado: EstadoEtapaProgreso;
  subEtapaId?: SubEtapaAnexoId;
}

export const ETAPAS_PROGRESO_VERTICAL: EtapaProgresoVertical[] = [
  {
    id: 'eval-anexo-9',
    titulo: 'EVALUACIÓN DEL ANEXO N°9',
    tipoIcono: 'sobre',
    estado: 'completado',
  },
  {
    id: 'principios-eticos',
    titulo: 'Cumplimiento de Principios Éticos',
    tipoIcono: 'portapapeles',
    estado: 'activo',
    subEtapaId: 'principios-eticos',
  },
  {
    id: 'normativa-legal',
    titulo: 'Cumplimiento de Normativa Legal',
    tipoIcono: 'portapapeles',
    estado: 'pendiente',
    subEtapaId: 'normativa-legal',
  },
  {
    id: 'firmar',
    titulo: 'Firmar',
    tipoIcono: 'avion',
    estado: 'pendiente',
    subEtapaId: 'firmar',
  },
];

export const CRITERIOS_ETICOS_INICIALES: CriterioEticoItem[] = [
  {
    id: 'consentimiento-informado',
    titulo: 'Consentimiento informado',
    descripcionAyuda:
      'Se informó al participante cómo van a ser utilizados sus datos y dio su consentimiento de participación. Se presentan documentos de los participantes (descripción de la participación, firmados, con DNI).',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
  {
    id: 'beneficencia-muestreo',
    titulo: 'Beneficencia en el muestreo',
    descripcionAyuda:
      'En el proceso de muestreo se busca checar si cometen faltas éticas por ejemplo derechos animales. (No se evalúa el proceso metodológico en si).',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
  {
    id: 'conducta-responsable',
    titulo: 'Conducta responsable y veracidad de los datos',
    descripcionAyuda:
      'Faltas a privacidad. Divulgación de datasets con datos sensibles.',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
  {
    id: 'integridad-academica',
    titulo: 'Integridad académica / científica',
    descripcionAyuda: 'Respeto a derechos de autor, patentes.',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
  {
    id: 'medida-seguridad-laboratorio',
    titulo: 'Medida de seguridad en el laboratorio',
    descripcionAyuda:
      'La metodología de investigación implica riesgos en las personas, animales o artefactos que se utilizarán durante la experimentación.',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
];

// --- 2. Criterios de Cumplimiento de Normativa Legal ---
export interface CriterioNormativaItem {
  id: string;
  titulo: string;
  descripcionAyuda: string;
  cumplimiento: ValorCumplimiento;
  observaciones: string;
  mostrarAyuda?: boolean;
}

export const CRITERIOS_NORMATIVA_INICIALES: CriterioNormativaItem[] = [
  {
    id: 'ley-universitaria',
    titulo: 'Ley Universitaria N° 30220 y Código de Ética de la Función Pública.',
    descripcionAyuda:
      'Cumplimiento de los deberes y principios éticos de la función pública universitaria y lineamientos institucionales (Ley N° 30220).',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
  {
    id: 'ley-datos-personales',
    titulo: 'Ley de Protección de Datos Personales (N° 29733).',
    descripcionAyuda:
      'Garantía de confidencialidad, anonimización y debido resguardo de datos personales y sensibles de los participantes.',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
  {
    id: 'ley-salud',
    titulo: 'Ley General de Salud (N° 26842).',
    descripcionAyuda:
      'Salvaguarda irrestricta de la vida, salud integral y derechos fundamentales de personas intervenidas en el estudio.',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
  {
    id: 'reglamento-ensayos-clinicos',
    titulo: 'Reglamento de Ensayos Clínicos (DS N° 021-2017-SA) (si aplica).',
    descripcionAyuda:
      'Alineamiento a estándares vigentes de ensayos clínicos y buenas prácticas de investigación médica si involucra intervención clínica.',
    cumplimiento: null,
    observaciones: '',
    mostrarAyuda: false,
  },
];

// --- 3. Recomendaciones del Comité ---
export type DictamenComite =
  | 'aprobado'
  | 'aprobado_observaciones'
  | 'no_aprobado';

export interface OpcionDictamenComite {
  id: DictamenComite;
  label: string;
}

export const OPCIONES_DICTAMEN_COMITE: OpcionDictamenComite[] = [
  { id: 'aprobado', label: 'Aprobado' },
  { id: 'aprobado_observaciones', label: 'Aprobado con observaciones' },
  { id: 'no_aprobado', label: 'No aprobado' },
];

export const AYUDA_DICTAMEN_COMITE = [
  {
    titulo: 'Aprobado',
    descripcion: 'No se identifican observaciones éticas.',
  },
  {
    titulo: 'Aprobado con observaciones',
    descripcion: 'Se deben subsanar las siguientes observaciones antes de su ejecución:',
  },
  {
    titulo: 'No aprobado',
    descripcion: 'El proyecto no cumple con los principios éticos requeridos.',
  },
];

export interface RecomendacionComiteState {
  dictamen: DictamenComite;
  observaciones: string;
}

export const DEFAULT_RECOMENDACION_COMITE: RecomendacionComiteState = {
  dictamen: 'aprobado_observaciones',
  observaciones: '',
};

// --- 4. Firma Digital de Evaluación ---
export interface FirmaEvaluadorState {
  firmaDataUrl: string;
  password: string;
  comiteNombre: string;
  horaRecibido: string;
  firmado: boolean;
}

export const DEFAULT_FIRMA_EVALUADOR: FirmaEvaluadorState = {
  firmaDataUrl: '',
  password: '',
  comiteNombre: 'COMITÉ DE ÉTICA',
  horaRecibido: 'Recibido · 10:35 a.m.',
  firmado: false,
};
