import {
  VeredictoEvaluador,
  DictamenFinal,
} from '../models/sesion-votacion.model.js';

export interface VotoCalculo {
  evaluadorId: string;
  veredicto: VeredictoEvaluador;
  tieneObservacionesDocumentales: boolean;
}

export interface ResultadoCalculoVotacion {
  dictamen: DictamenFinal;
  puedeCerrarAnticipadamente: boolean;
  motivoRegla: string;
  totalAprobados: number;
  totalAprobadosConObs: number;
  totalNoAprobados: number;
}

export const TOTAL_EVALUADORES = 5;
export const UMBRAL_MAYORIA = 3;

/**
 * Motor de reglas puro para la consolidación de veredictos del Comité de Ética (CEI).
 *
 * Reglas de Mayoría:
 * - 3 evaluaciones favorables sin observaciones pendientes: Aprobado.
 * - 3 evaluaciones favorables con observaciones menores o documentales: Aprobado con observaciones.
 * - 3 o más evaluaciones desfavorables: No aprobado.
 *
 * Cierre anticipado:
 * - Con 3 favorables NO se cierra anticipadamente, pues si los otros 2 votan con observaciones,
 *   el resultado colectivo cambiaría a "Aprobado con observaciones".
 * - Solo se permite cierre anticipado si se alcanzan 3 votos "No aprobado", pues la desaprobación
 *   se vuelve matemáticamente irreversible.
 *
 * Desempate (2-2-1):
 * - Cuando existe un empate exacto entre opciones favorables (ej. 2 Aprobado y 2 Aprobado con observaciones),
 *   se requiere el voto dirimente del Presidente del CEI.
 */
export function calcularReglasVotacion(
  votos: VotoCalculo[],
  votoPresidenteDirimente?: VeredictoEvaluador,
): ResultadoCalculoVotacion {
  const totalVotos = votos.length;
  const noAprobados = votos.filter((v) => v.veredicto === 'NoAprobado').length;
  const aprobadosPuros = votos.filter(
    (v) => v.veredicto === 'Aprobado' && !v.tieneObservacionesDocumentales,
  ).length;
  const aprobadosConObs = votos.filter(
    (v) =>
      v.veredicto === 'AprobadoConObservaciones' ||
      (v.veredicto === 'Aprobado' && v.tieneObservacionesDocumentales),
  ).length;
  const totalFavorables = aprobadosPuros + aprobadosConObs;

  // 1. REGLA DE CIERRE ANTICIPADO: 3 o más votos No Aprobado
  if (noAprobados >= UMBRAL_MAYORIA) {
    return {
      dictamen: 'NoAprobado',
      puedeCerrarAnticipadamente: true,
      motivoRegla: 'Mayoría desfavorable alcanzada (>= 3 votos No Aprobado).',
      totalAprobados: aprobadosPuros,
      totalAprobadosConObs: aprobadosConObs,
      totalNoAprobados: noAprobados,
    };
  }

  // 2. Si aún no se completan los 5 votos y no hay rechazo definitivo, se debe esperar
  if (totalVotos < TOTAL_EVALUADORES) {
    return {
      dictamen: 'EnEvaluacion',
      puedeCerrarAnticipadamente: false,
      motivoRegla: `Votación en curso (${totalVotos}/${TOTAL_EVALUADORES}). Esperando votos restantes para consolidar observaciones.`,
      totalAprobados: aprobadosPuros,
      totalAprobadosConObs: aprobadosConObs,
      totalNoAprobados: noAprobados,
    };
  }

  // 3. CON LOS 5 VOTOS EMITIDOS:
  // 3.1. Tres o más evaluaciones desfavorables
  if (noAprobados >= UMBRAL_MAYORIA) {
    return {
      dictamen: 'NoAprobado',
      puedeCerrarAnticipadamente: false,
      motivoRegla: 'Mayoría desfavorable (>= 3 votos No Aprobado).',
      totalAprobados: aprobadosPuros,
      totalAprobadosConObs: aprobadosConObs,
      totalNoAprobados: noAprobados,
    };
  }

  // 3.2. Empate exacto entre Aprobado y Aprobado con Observaciones (caso 2-2-1)
  if (aprobadosPuros === aprobadosConObs) {
    if (votoPresidenteDirimente) {
      const dictamenDirimido: DictamenFinal =
        votoPresidenteDirimente === 'Aprobado'
          ? 'Aprobado'
          : votoPresidenteDirimente === 'AprobadoConObservaciones'
            ? 'AprobadoConObservaciones'
            : 'NoAprobado';

      return {
        dictamen: dictamenDirimido,
        puedeCerrarAnticipadamente: false,
        motivoRegla: 'Dictamen resuelto por voto dirimente del Presidente del CEI.',
        totalAprobados: aprobadosPuros,
        totalAprobadosConObs: aprobadosConObs,
        totalNoAprobados: noAprobados,
      };
    }

    return {
      dictamen: 'EmpateRequierePresidente',
      puedeCerrarAnticipadamente: false,
      motivoRegla:
        'Empate entre opciones favorables (2 vs 2); requiere voto dirimente del Presidente del CEI.',
      totalAprobados: aprobadosPuros,
      totalAprobadosConObs: aprobadosConObs,
      totalNoAprobados: noAprobados,
    };
  }

  // 3.3. Tres o más evaluaciones favorables
  if (totalFavorables >= UMBRAL_MAYORIA) {
    // Sin observaciones pendientes
    if (aprobadosConObs === 0) {
      return {
        dictamen: 'Aprobado',
        puedeCerrarAnticipadamente: false,
        motivoRegla: 'Mayoría favorable sin observaciones pendientes.',
        totalAprobados: aprobadosPuros,
        totalAprobadosConObs: aprobadosConObs,
        totalNoAprobados: noAprobados,
      };
    }

    // Con observaciones menores o documentales
    return {
      dictamen: 'AprobadoConObservaciones',
      puedeCerrarAnticipadamente: false,
      motivoRegla:
        'Mayoría favorable alcanzada con observaciones documentales o menores.',
      totalAprobados: aprobadosPuros,
      totalAprobadosConObs: aprobadosConObs,
      totalNoAprobados: noAprobados,
    };
  }

  return {
    dictamen: 'EmpateRequierePresidente',
    puedeCerrarAnticipadamente: false,
    motivoRegla:
      'Dispersión de votos sin mayoría; requiere voto dirimente del Presidente del CEI.',
    totalAprobados: aprobadosPuros,
    totalAprobadosConObs: aprobadosConObs,
    totalNoAprobados: noAprobados,
  };
}
