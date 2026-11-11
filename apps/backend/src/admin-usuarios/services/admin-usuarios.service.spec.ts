import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminUsuariosService } from './admin-usuarios.service.js';

describe('AdminUsuariosService (Cursor Pagination)', () => {
  let service: AdminUsuariosService;
  let prismaMock: any;
  let refreshTokenServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      usuario: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      rol: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      usuarioRol: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      historial: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (arg: any) => {
        if (typeof arg === 'function') {
          return await arg(prismaMock);
        }
        return await Promise.all(arg);
      }),
    };

    refreshTokenServiceMock = {
      revokeAllForUser: vi.fn().mockResolvedValue(undefined),
    };

    service = new AdminUsuariosService(prismaMock, refreshTokenServiceMock);
  });

  it('lista usuarios con cursor (take = limit + 1) y calcula nextCursor cuando hay página siguiente', async () => {
    const mockRows = [
      {
        id: 'usr_1',
        nombre: 'Dr. Ricardo',
        apellido: 'Palma',
        email: 'rpalma@untels.edu.pe',
        activo: true,
        creadoEn: new Date('2026-11-01T10:00:00Z'),
        roles: [{ rol: { id: 3, codigo: 'PRESIDENTE_CEI', nombre: 'Presidente del CEI' } }],
      },
      {
        id: 'usr_2',
        nombre: 'Dra. Rosa',
        apellido: 'Alva',
        email: 'ralva@untels.edu.pe',
        activo: true,
        creadoEn: new Date('2026-11-01T09:00:00Z'),
        roles: [{ rol: { id: 4, codigo: 'VICEPRESIDENTE_CEI', nombre: 'Vicepresidente del CEI' } }],
      },
      {
        id: 'usr_3',
        nombre: 'Dr. Manuel',
        apellido: 'Quispe',
        email: 'mquispe@untels.edu.pe',
        activo: true,
        creadoEn: new Date('2026-11-01T08:00:00Z'),
        roles: [{ rol: { id: 7, codigo: 'VOCAL_CEI', nombre: 'Vocal del CEI' } }],
      },
    ];

    prismaMock.usuario.findMany.mockResolvedValue(mockRows);
    prismaMock.usuario.count
      .mockResolvedValueOnce(5) // totalCategoria
      .mockResolvedValueOnce(5) // totalEvaluadores
      .mockResolvedValueOnce(12) // totalSolicitantes
      .mockResolvedValueOnce(2); // totalAdministradores

    const res = await service.listarConCursor({
      categoria: 'EVALUADOR',
      limit: 2,
    });

    expect(prismaMock.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3, // limit + 1
        orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(res.items).toHaveLength(2);
    expect(res.pageInfo.hasNextPage).toBe(true);
    expect(res.pageInfo.nextCursor).toBe('usr_2');
    expect(res.conteos.totalEvaluadores).toBe(5);
    expect(res.conteos.totalSolicitantes).toBe(12);
    expect(res.conteos.totalAdministradores).toBe(2);
  });

  it('aplica cursor y skip: 1 cuando se envía un cursor válido', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({ id: 'usr_2' });
    prismaMock.usuario.findMany.mockResolvedValue([
      {
        id: 'usr_3',
        nombre: 'Dr. Manuel',
        apellido: 'Quispe',
        email: 'mquispe@untels.edu.pe',
        activo: true,
        creadoEn: new Date('2026-11-01T08:00:00Z'),
        roles: [{ rol: { id: 7, codigo: 'VOCAL_CEI', nombre: 'Vocal del CEI' } }],
      },
    ]);
    prismaMock.usuario.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    const res = await service.listarConCursor({
      categoria: 'EVALUADOR',
      cursor: 'usr_2',
      limit: 2,
    });

    expect(prismaMock.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        cursor: { id: 'usr_2' },
        skip: 1,
      }),
    );
    expect(res.items).toHaveLength(1);
    expect(res.pageInfo.hasNextPage).toBe(false);
    expect(res.pageInfo.nextCursor).toBeNull();
  });

  it('revoca todos los refresh tokens cuando se deshabilita un usuario activo', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'usr_sol_1',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'cmendoza@untels.edu.pe',
      activo: true,
      creadoEn: new Date(),
      roles: [{ rol: { id: 1, codigo: 'SOLICITANTE', nombre: 'Solicitante' } }],
    });

    prismaMock.usuario.update.mockResolvedValue({
      id: 'usr_sol_1',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'cmendoza@untels.edu.pe',
      activo: false,
      creadoEn: new Date(),
      roles: [{ rol: { id: 1, codigo: 'SOLICITANTE', nombre: 'Solicitante' } }],
    });

    const res = await service.cambiarEstadoUsuario(
      'usr_sol_1',
      { activo: false },
      'usr_admin_2',
    );

    expect(res.habilitado).toBe(false);
    expect(refreshTokenServiceMock.revokeAllForUser).toHaveBeenCalledWith(
      'usr_sol_1',
    );
  });

  it('rechaza crear un usuario con rol fijo del CEI (solo permite Solicitante o Administrador)', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.rol.findUnique.mockResolvedValue({
      id: 3,
      codigo: 'PRESIDENTE_CEI',
      nombre: 'Presidente del CEI',
    });

    await expect(
      service.crearUsuario({
        nombre: 'Nuevo',
        apellido: 'Miembro',
        email: 'nuevo@untels.edu.pe',
        rolId: 3,
      }),
    ).rejects.toThrow(/Solo se permite crear cuentas con el rol de Solicitante o Administrador/);
  });

  it('actualiza la contraseña en usuarios y registra evento ADMIN_USUARIO_PASSWORD_ACTUALIZADA en historial', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'usr_sol_1',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'cmendoza@untels.edu.pe',
      password: 'OldPassword123',
      activo: true,
      creadoEn: new Date(),
      roles: [{ rol: { id: 1, codigo: 'SOLICITANTE', nombre: 'Solicitante' } }],
    });

    prismaMock.usuario.update.mockResolvedValue({
      id: 'usr_sol_1',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'cmendoza@untels.edu.pe',
      password: 'NuevaPassword2026!',
      activo: true,
      creadoEn: new Date(),
      roles: [{ rol: { id: 1, codigo: 'SOLICITANTE', nombre: 'Solicitante' } }],
    });

    const res = await service.cambiarPasswordUsuario(
      'usr_sol_1',
      {
        nuevaPassword: 'NuevaPassword2026!',
        confirmarPassword: 'NuevaPassword2026!',
      },
      'usr_admin_2',
    );

    expect(prismaMock.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usr_sol_1' },
        data: { password: 'NuevaPassword2026!' },
      }),
    );
    expect(prismaMock.historial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entidad: 'Usuario',
          entidadId: 'usr_sol_1',
          evento: 'ADMIN_USUARIO_PASSWORD_ACTUALIZADA',
          usuarioId: 'usr_admin_2',
        }),
      }),
    );
    expect(res.passwordEnmascarada).toBe('NuevaPassword2026!');
    expect(refreshTokenServiceMock.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('rechaza contraseñas que no cumplan con 8 caracteres, mayúsculas, minúsculas, números y signos', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'usr_sol_1',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'cmendoza@untels.edu.pe',
      password: 'Estancia2026!#',
      activo: true,
      creadoEn: new Date(),
      roles: [{ rol: { id: 1, codigo: 'SOLICITANTE', nombre: 'Solicitante' } }],
    });

    await expect(
      service.cambiarPasswordUsuario('usr_sol_1', {
        nuevaPassword: 'password123', // sin mayúscula ni signo
      }),
    ).rejects.toThrow(
      /mínimo 8 caracteres e incluir al menos una mayúscula, una minúscula, un número y un signo/,
    );
  });
});

