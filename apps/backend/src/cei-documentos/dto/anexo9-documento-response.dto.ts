export interface Anexo9DocumentoMetadataResponseDto {
  documentoId: string;
  expedienteId: string;
  codigoExpediente: string;
  codigoTicket: string | null;
  sesionVotacionId: string | null;
  tipoDocumento: string;
  estado: string;
  dictamenFinal: string;
  nombreArchivo: string;
  mimeType: string;
  tamanioBytes: number;
  totalPaginas: number;
  hashSha256: string;
  version: number;
  urlPublica: string | null;
  generadoEn: string;
  firmantesSnapshot: Array<{
    evaluadorId: string;
    nombreCompleto: string;
    cargoCei: string;
    hashSha256: string;
    firmadoEn: string;
  }>;
}

