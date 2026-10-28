export type VeredictoEvaluador = 'Aprobado' | 'AprobadoConObservaciones' | 'NoAprobado';

export type DictamenFinal =
  | 'EnEvaluacion'
  | 'Aprobado'
  | 'AprobadoConObservaciones'
  | 'NoAprobado'
  | 'EmpateRequierePresidente';

export type EstadoSesionVotacion = 'EnProgreso' | 'CerradaAnticipada' | 'CerradaCompleta';

export interface CriterioEvaluado {
  id: string;
  cumple: boolean;
  observaciones: string;
}

export interface CriteriosAnexoData {
  principiosEticos: CriterioEvaluado[];
  normativaLegal: CriterioEvaluado[];
}

export interface VotoEvaluadorData {
  evaluadorId: string;
  veredicto: VeredictoEvaluador;
  tieneObservacionesDocumentales: boolean;
  observaciones: string;
  fechaVoto: string; // ISO 8601
}

export interface DictamenPresidenteCeiData {
  presidenteId: string;
  resultado: VeredictoEvaluador | null;
  fechaEmision: string | null; // ISO 8601
}

export interface DictamenGlobalData {
  resultado: DictamenFinal;
  reglaAplicada: string | null;
  totalAprobado: number;
  totalAprobadoConObs: number;
  totalNoAprobado: number;
  fechaCalculo: string | null;
}

export interface SesionVotacionJson {
  anexoId: string;
  expedienteId: string;
  version: number;
  evaluadoresAsignados: string[];
  presidenteCeiId: string;
  criteriosAnexo: CriteriosAnexoData;
  votos: VotoEvaluadorData[];
  progreso: {
    totalEsperados: number;
    totalRecibidos: number;
    cierreAnticipadoDisponible: boolean;
  };
  dictamenGlobal: DictamenGlobalData;
  dictamenPresidenteCei: DictamenPresidenteCeiData;
  estado: EstadoSesionVotacion;
  fechaCierre: string | null;
}
