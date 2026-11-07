export interface CriterioEvaluacionConsolidado {
  id: string;
  numero: number;
  categoria: 'PRINCIPIOS_ETICOS' | 'NORMATIVA_LEGAL';
  descripcion: string;
  eval1Cumple: boolean;
  eval2Cumple: boolean;
  eval3Cumple: boolean;
  eval4Cumple: boolean;
  eval5Cumple: boolean;
  observaciones: {
    evaluadorNombre: string;
    cargo: string;
    texto: string;
  }[];
}

export interface FirmanteConsolidado {
  evaluadorId: string;
  nombreCompleto: string;
  cargoCei: string;
  firmaDataUrl: string;
  hashSha256: string;
  firmadoEn: string;
}

export interface Anexo9ConsolidadoDto {
  expediente: {
    id: string;
    codigo: string;
    tituloProyecto: string;
    investigadorPrincipal: string;
    facultadOUnidad: string;
    fechaPresentacion: string;
    fechaDictamen: string;
  };
  sesionVotacionId?: string;
  dictamenFinal: string;
  criterios: CriterioEvaluacionConsolidado[];
  observacionesGenerales: {
    evaluadorNombre: string;
    cargo: string;
    texto: string;
  }[];
  firmantes: FirmanteConsolidado[];
}

