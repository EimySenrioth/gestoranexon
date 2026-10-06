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

export interface EtapaProgresoVertical {
  id: string;
  titulo: string;
  tipoIcono: 'sobre' | 'portapapeles' | 'avion';
  estado: EstadoEtapaProgreso;
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
  },
  {
    id: 'normativa-legal',
    titulo: 'Cumplimiento de Normativa Legal',
    tipoIcono: 'portapapeles',
    estado: 'pendiente',
  },
  {
    id: 'firmar',
    titulo: 'Firmar',
    tipoIcono: 'avion',
    estado: 'pendiente',
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
