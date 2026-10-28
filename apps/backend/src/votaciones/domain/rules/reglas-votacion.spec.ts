import { describe, it, expect } from 'vitest';
import {
  calcularReglasVotacion,
  VotoCalculo,
} from './reglas-votacion.js';

describe('Motor de Reglas de Votación (CEI)', () => {
  it('Caso 3-0-2: Tres Aprobados puros y dos No Aprobados -> Debe ser Aprobado', () => {
    const votos: VotoCalculo[] = [
      { evaluadorId: '1', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '2', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '3', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '4', veredicto: 'NoAprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '5', veredicto: 'NoAprobado', tieneObservacionesDocumentales: false },
    ];

    const resultado = calcularReglasVotacion(votos);

    expect(resultado.dictamen).toBe('Aprobado');
    expect(resultado.puedeCerrarAnticipadamente).toBe(false);
    expect(resultado.totalAprobados).toBe(3);
    expect(resultado.totalNoAprobados).toBe(2);
  });

  it('Caso con Observaciones: Tres Aprobados pero con observaciones documentales -> AprobadoConObservaciones', () => {
    const votos: VotoCalculo[] = [
      { evaluadorId: '1', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '2', veredicto: 'Aprobado', tieneObservacionesDocumentales: true }, // Obs documental
      { evaluadorId: '3', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '4', veredicto: 'NoAprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '5', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
    ];

    const resultado = calcularReglasVotacion(votos);

    expect(resultado.dictamen).toBe('AprobadoConObservaciones');
    expect(resultado.totalAprobadosConObs).toBe(1);
    expect(resultado.totalAprobados).toBe(3);
  });

  it('Caso 0-0-3 Temprano: Tres No Aprobados inmediatos -> Cierre Anticipado NoAprobado', () => {
    const votos: VotoCalculo[] = [
      { evaluadorId: '1', veredicto: 'NoAprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '2', veredicto: 'NoAprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '3', veredicto: 'NoAprobado', tieneObservacionesDocumentales: false },
    ];

    const resultado = calcularReglasVotacion(votos);

    expect(resultado.dictamen).toBe('NoAprobado');
    expect(resultado.puedeCerrarAnticipadamente).toBe(true);
    expect(resultado.totalNoAprobados).toBe(3);
  });

  it('Caso Tres Aprobados Tempranos: NO debe cerrar anticipado, debe esperar los 5 votos', () => {
    const votos: VotoCalculo[] = [
      { evaluadorId: '1', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '2', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '3', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
    ];

    const resultado = calcularReglasVotacion(votos);

    expect(resultado.dictamen).toBe('EnEvaluacion');
    expect(resultado.puedeCerrarAnticipadamente).toBe(false);
  });

  it('Caso 2-2-1 con Desempate: Presidente CEI dirime resultado', () => {
    const votos: VotoCalculo[] = [
      { evaluadorId: '1', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '2', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '3', veredicto: 'AprobadoConObservaciones', tieneObservacionesDocumentales: true },
      { evaluadorId: '4', veredicto: 'AprobadoConObservaciones', tieneObservacionesDocumentales: true },
      { evaluadorId: '5', veredicto: 'NoAprobado', tieneObservacionesDocumentales: false },
    ];

    const sinPresidente = calcularReglasVotacion(votos);
    expect(sinPresidente.dictamen).toBe('EmpateRequierePresidente');

    const conPresidente = calcularReglasVotacion(votos, 'AprobadoConObservaciones');
    expect(conPresidente.dictamen).toBe('AprobadoConObservaciones');
  });

  it('Caso 5 Aprobados Unánimes sin observaciones -> Aprobado', () => {
    const votos: VotoCalculo[] = [
      { evaluadorId: '1', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '2', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '3', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '4', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
      { evaluadorId: '5', veredicto: 'Aprobado', tieneObservacionesDocumentales: false },
    ];

    const resultado = calcularReglasVotacion(votos);
    expect(resultado.dictamen).toBe('Aprobado');
    expect(resultado.totalAprobados).toBe(5);
  });
});
