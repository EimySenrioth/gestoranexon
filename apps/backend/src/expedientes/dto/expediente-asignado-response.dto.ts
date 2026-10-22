export interface MiembroCeiResumenDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
}

export interface ExpedienteAsignadoResponseDto {
  expedienteId: string;
  codigoExpediente: string;
  ticketId: string;
  codigoTicket: string;
  estadoAnterior: string;
  estadoNuevo: string;
  asignadoA: MiembroCeiResumenDto;
  asignadoPorId: string;
  fechaAsignacion: string;
  notas?: string;
  plazoDias?: number;
}

export interface MiembroCeiDisponibleDto {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  roles: string[];
  cargaExpedientesActivos: number;
}
