import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NewUsersService,
  ROL_SOLICITANTE_FIJO_ID,
} from './newusers.service.js';

describe('NewUsersService', () => {
  let service: NewUsersService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      usuario: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      historial: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (fn: any) => await fn(prismaMock)),
    };

    service = new NewUsersService(prismaMock);
  });

  it('registra un nuevo usuario asignando siempre rolId = 1 (SOLICITANTE)', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue(null);
    prismaMock.usuario.create.mockResolvedValue({
      id: 'usr_sol_99',
      nombre: 'Ana',
      apellido: 'Torres Vega',
      email: 'atorres@untels.edu.pe',
      password: 'Password2026!#',
      activo: true,
      creadoEn: new Date('2026-11-11T16:00:00Z'),
      roles: [
        {
          rol: {
            id: 1,
            codigo: 'SOLICITANTE',
            nombre: 'Solicitante / Investigador',
          },
        },
      ],
    });

    const res = await service.registrarSolicitante({
      nombre: 'Ana Torres Vega',
      email: 'atorres@untels.edu.pe',
      password: 'Password2026!#',
      confirmarPassword: 'Password2026!#',
    });

    expect(prismaMock.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'atorres@untels.edu.pe',
          nombre: 'Ana Torres',
          apellido: 'Vega',
          password: 'Password2026!#',
          activo: true,
          roles: {
            create: [{ rolId: ROL_SOLICITANTE_FIJO_ID }],
          },
        }),
      }),
    );

    expect(prismaMock.historial.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          entidad: 'Usuario',
          entidadId: 'usr_sol_99',
          evento: 'AUTO_REGISTRO_SOLICITANTE',
        }),
      }),
    );

    expect(res.rolId).toBe(1);
    expect(res.rolCodigo).toBe('SOLICITANTE');
  });

  it('rechaza contraseñas débiles sin mayúsculas, signos o menores a 8 caracteres', async () => {
    await expect(
      service.registrarSolicitante({
        nombre: 'Ana Torres',
        email: 'atorres@untels.edu.pe',
        password: 'password123',
      }),
    ).rejects.toThrow(/mínimo 8 caracteres con mayúsculas, minúsculas, números y signos/);
  });

  it('lanza ConflictException si el correo ya está registrado', async () => {
    prismaMock.usuario.findUnique.mockResolvedValue({
      id: 'usr_existente',
      email: 'atorres@untels.edu.pe',
    });

    await expect(
      service.registrarSolicitante({
        nombre: 'Ana Torres',
        email: 'atorres@untels.edu.pe',
        password: 'Password2026!#',
      }),
    ).rejects.toThrow(/Ya existe una cuenta registrada/);
  });
});

