import { formatearCorrelativo } from '../../common/utils/correlativo.util.js';

export const MOCK_DEV_TICKETS = new Map<string, any>();
export const MOCK_DEV_HISTORIAL = new Map<string, any[]>();
export const MOCK_DEV_EXPEDIENTES = new Map<string, any>();
export const MOCK_DEV_SECUENCIAS = new Map<string, number>();

export function devSiguienteCorrelativo(prefijo: 'TCK' | 'EXP', anio: number): string {
  const clave = `${prefijo}-${anio}`;
  const actual = (MOCK_DEV_SECUENCIAS.get(clave) || 0) + 1;
  MOCK_DEV_SECUENCIAS.set(clave, actual);
  return formatearCorrelativo(prefijo, anio, actual);
}
