import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminUsuariosController } from './admin-usuarios.controller.js';

describe('AdminUsuariosController', () => {
  let controller: AdminUsuariosController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      listarConCursor: vi.fn(),
      obtenerResumenConteos: vi.fn(),
      listarRolesDisponibles: vi.fn(),
      obtenerPorId: vi.fn(),
      crearUsuario: vi.fn(),
      actualizarUsuario: vi.fn(),
      cambiarEstadoUsuario: vi.fn(),
      cambiarPasswordUsuario: vi.fn(),
    };
    controller = new AdminUsuariosController(serviceMock);
  });

  it('delega cambiarPasswordUsuario al servicio', async () => {
    const mockFila = { id: 'usr_1', passwordEnmascarada: 'NuevaPass2026!' };
    serviceMock.cambiarPasswordUsuario.mockResolvedValue(mockFila);

    const res = await controller.cambiarPasswordUsuario(
      'usr_1',
      { nuevaPassword: 'NuevaPass2026!', confirmarPassword: 'NuevaPass2026!' },
      'usr_admin_2',
    );

    expect(serviceMock.cambiarPasswordUsuario).toHaveBeenCalledWith(
      'usr_1',
      { nuevaPassword: 'NuevaPass2026!', confirmarPassword: 'NuevaPass2026!' },
      'usr_admin_2',
    );
    expect(res).toEqual(mockFila);
  });

  it('delega listarConCursor al servicio', async () => {
    const mockRes = {
      items: [],
      pageInfo: { limit: 8, nextCursor: null, hasNextPage: false, totalCategoria: 0 },
      conteos: { totalEvaluadores: 5, totalSolicitantes: 1 },
    };
    serviceMock.listarConCursor.mockResolvedValue(mockRes);

    const res = await controller.listarConCursor({
      categoria: 'EVALUADOR',
      limit: 8,
    });

    expect(serviceMock.listarConCursor).toHaveBeenCalledWith({
      categoria: 'EVALUADOR',
      limit: 8,
    });
    expect(res).toEqual(mockRes);
  });
});

