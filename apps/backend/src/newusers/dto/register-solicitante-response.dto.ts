export interface RegisterSolicitanteResponseDto {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  rolId: 1;
  rolCodigo: 'SOLICITANTE';
  rolEtiqueta: string;
  activo: boolean;
  creadoEn: string;
}

