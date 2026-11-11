import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NewUsersController } from './newusers.controller.js';

describe('NewUsersController', () => {
  let controller: NewUsersController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      registrarSolicitante: vi.fn(),
    };
    controller = new NewUsersController(serviceMock);
  });

  it('delega registrarSolicitante al servicio', async () => {
    const mockRes = {
      id: 'usr_sol_99',
      nombre: 'Ana',
      apellido: 'Torres',
      nombreCompleto: 'Ana Torres',
      email: 'atorres@untels.edu.pe',
      rolId: 1 as const,
      rolCodigo: 'SOLICITANTE' as const,
      rolEtiqueta: 'Solicitante / Investigador',
      activo: true,
      creadoEn: '2026-11-11T16:00:00.000Z',
    };
    serviceMock.registrarSolicitante.mockResolvedValue(mockRes);

    const res = await controller.registrarSolicitante({
      nombre: 'Ana Torres',
      email: 'atorres@untels.edu.pe',
      password: 'Password2026!#',
    });

    expect(serviceMock.registrarSolicitante).toHaveBeenCalledWith({
      nombre: 'Ana Torres',
      email: 'atorres@untels.edu.pe',
      password: 'Password2026!#',
    });
    expect(res).toEqual(mockRes);
  });
});

