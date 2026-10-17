import type { CreateTicketDto } from '../../ticketmanager/dto/index.js';

/** Clave R6: título normalizado + codigoSolicitante (ambos limpios y concatenados). */
export function calcularClaveDuplicidad(
  titulo: string,
  codigoSolicitante?: string | null,
): string {
  const normTitulo = titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normCodigo = (codigoSolicitante || 'SIN_CODIGO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ]/g, '')
    .trim();
  return `${normTitulo}#${normCodigo}`;
}

export function normalizarCondicionales<T extends Partial<CreateTicketDto>>(dto: T): T {
  const normalizado = { ...dto };
  if (normalizado.financiamiento !== 'Externo') {
    normalizado.financiamientoDetalle = null as any;
  }
  if (normalizado.tipoInvestigacion !== 'Otro') {
    normalizado.tipoInvestigacionOtro = null as any;
  }
  return normalizado;
}
