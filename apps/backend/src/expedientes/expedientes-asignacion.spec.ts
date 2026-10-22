import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpedientesService } from './expedientes.service.js';
import {
  ExpedienteNoEncontradoException,
  ExpedienteYaAsignadoException,
  MiembroCeiNoEncontradoException,
  UsuarioNoEsMiembroCeiException,
  ExpedienteNoAptoParaAsignacionException,
} from '../common/errors/index.js';

describe('ExpedientesService - Asignación y Auto-Asignación Plenaria CEI', () => {
  let service: ExpedientesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      secuencia: {
        findUnique: vi.fn().mockResolvedValue({ clave: 'TCK-2026', ultimo: 5 }),
        upsert: vi.fn().mockResolvedValue({ clave: 'TCK-2026', ultimo: 6 }),
      },
      expediente: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      usuario: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      ticket: {
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      evaluacion: {
        findFirst: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
      },
      ticketHistorial: {
        create: vi.fn(),
      },
      notificacion: {
        create: vi.fn(),
        createMany: vi.fn(),
      },
      $queryRaw: vi.fn().mockResolvedValue([{ ultimo: 88 }]),
      $transaction: vi.fn((fnOrArr) => {
        if (typeof fnOrArr === 'function') {
          return fnOrArr(mockPrisma);
        }
        return Promise.all(fnOrArr);
      }),
    };

    service = new ExpedientesService(mockPrisma);
  });

  const mockExpedienteIniciado = {
    id: 'exp-123',
    codigo: 'EXP-2026-00010',
    estado: 'INICIADO',
    ticket: {
      id: 'tck-123',
      codigo: 'TCK-2026-00010',
      asignadoAId: null,
    },
  };

  const mockUsuarioVocalCei = {
    id: 'usr-vocal-1',
    nombre: 'Elena',
    apellido: 'Paredes',
    email: 'elena.paredes@estanciaperu.gob.pe',
    activo: true,
    roles: [
      {
        rol: {
          id: 7,
          codigo: 'VOCAL_CEI',
          nombre: 'Vocal del CEI',
        },
      },
    ],
  };

  const mockCincoMiembrosCei = [
    {
      id: 'usr-1',
      nombre: 'Ricardo',
      apellido: 'Palma',
      email: 'presi@estancia.pe',
      roles: [{ rol: { codigo: 'PRESIDENTE_CEI', nombre: 'Presidente del CEI' } }],
    },
    {
      id: 'usr-2',
      nombre: 'Rosa',
      apellido: 'Alva',
      email: 'vice@estancia.pe',
      roles: [{ rol: { codigo: 'VICEPRESIDENTE_CEI', nombre: 'Vicepresidente del CEI' } }],
    },
    {
      id: 'usr-3',
      nombre: 'Andrés',
      apellido: 'Salazar',
      email: 'sectec@estancia.pe',
      roles: [{ rol: { codigo: 'SECRETARIA_TECNICA_CEI', nombre: 'Secretaría Técnica del CEI' } }],
    },
    {
      id: 'usr-4',
      nombre: 'Patricia',
      apellido: 'Vega',
      email: 'secadm@estancia.pe',
      roles: [{ rol: { codigo: 'SECRETARIA_ADMINISTRATIVA_CEI', nombre: 'Secretaría Administrativa del CEI' } }],
    },
    {
      id: 'usr-5',
      nombre: 'Elena',
      apellido: 'Paredes',
      email: 'vocal@estancia.pe',
      roles: [{ rol: { codigo: 'VOCAL_CEI', nombre: 'Vocal del CEI' } }],
    },
  ];

  it('debe auto-asignar a los 5 miembros del CEI al crear un expediente manteniendo el estado INICIADO', async () => {
    mockPrisma.expediente.create.mockResolvedValue({
      id: 'exp-auto-1',
      codigo: 'EXP-2026-00088',
      estado: 'INICIADO',
    });

    mockPrisma.ticket.create.mockResolvedValue({
      id: 'tck-auto-1',
      codigo: 'TCK-2026-00088',
      titulo: 'Proyecto Genómica Andina',
      estado: 'REGISTRADO',
      solicitanteId: 'usr-sol-1',
      creadoEn: new Date(),
    });

    mockPrisma.usuario.findMany.mockResolvedValue(mockCincoMiembrosCei);

    const resultado = await service.crearExpediente(
      {
        titulo: 'Proyecto Genómica Andina',
        tipoSolicitud: 'INVESTIGACION',
      } as any,
      'usr-sol-1',
    );

    expect(resultado).toBeDefined();
    expect(resultado.codigoExpediente).toBe('EXP-2026-00088');
    expect(resultado.estado).toBe('REGISTRADO');

    // Verifica que expediente se creó con estado INICIADO
    expect(mockPrisma.expediente.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: 'INICIADO' }),
      }),
    );

    // Verifica que el ticket se creó con los metadatos robustos de asignación plenaria
    expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'REGISTRADO',
          metadata: expect.objectContaining({
            asignacionPlenaria: expect.objectContaining({
              tipo: 'AUTO_PLENO_CEI',
              reglasDeliberacion: expect.objectContaining({
                totalEvaluadores: 5,
                quorumMinimoSesion: 3,
                mayoriaRequerida: 3,
              }),
              integridadAsignacion: expect.objectContaining({
                rolesRequeridos: 5,
                rolesCubiertos: 5,
                estado: 'COMPLETA',
              }),
              comiteSnapshot: expect.arrayContaining([
                expect.objectContaining({
                  rolCodigo: 'PRESIDENTE_CEI',
                  nombreCompleto: 'Ricardo Palma',
                }),
              ]),
            }),
          }),
        }),
      }),
    );

    // Verifica que se crearon las 5 evaluaciones (1 por cada miembro)
    expect(mockPrisma.evaluacion.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        { expedienteId: 'exp-auto-1', evaluadorId: 'usr-1' },
        { expedienteId: 'exp-auto-1', evaluadorId: 'usr-2' },
        { expedienteId: 'exp-auto-1', evaluadorId: 'usr-3' },
        { expedienteId: 'exp-auto-1', evaluadorId: 'usr-4' },
        { expedienteId: 'exp-auto-1', evaluadorId: 'usr-5' },
      ]),
    });

    // Verifica que se enviaron notificaciones a los 5
    expect(mockPrisma.notificacion.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ usuarioId: 'usr-1' }),
        expect.objectContaining({ usuarioId: 'usr-5' }),
      ]),
    });
  });

  it('debe permitir la reasignación manual extraordinaria a un miembro específico del CEI', async () => {
    mockPrisma.expediente.findFirst.mockResolvedValue(mockExpedienteIniciado);
    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuarioVocalCei);
    mockPrisma.evaluacion.findFirst.mockResolvedValue(null);

    const result = await service.asignarExpediente(
      'exp-123',
      {
        miembroCeiId: 'usr-vocal-1',
        notas: 'Reasignación por licencia del evaluador principal',
        plazoDias: 7,
      },
      'admin-usr-1',
    );

    expect(result).toBeDefined();
    expect(result.estadoNuevo).toBe('EN_EVALUACION');
    expect(result.asignadoA.id).toBe('usr-vocal-1');
    expect(result.asignadoA.roles).toContain('VOCAL_CEI');

    expect(mockPrisma.expediente.update).toHaveBeenCalledWith({
      where: { id: 'exp-123' },
      data: { estado: 'EN_EVALUACION' },
    });
    expect(mockPrisma.ticket.update).toHaveBeenCalledWith({
      where: { id: 'tck-123' },
      data: { asignadoAId: 'usr-vocal-1' },
    });
  });

  it('debe lanzar UsuarioNoEsMiembroCeiException si el usuario asignado manualmente no pertenece al CEI', async () => {
    const mockSolicitante = {
      id: 'usr-sol-1',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'sol@estancia.pe',
      activo: true,
      roles: [{ rol: { id: 1, codigo: 'SOLICITANTE', nombre: 'Solicitante' } }],
    };

    mockPrisma.expediente.findFirst.mockResolvedValue(mockExpedienteIniciado);
    mockPrisma.usuario.findUnique.mockResolvedValue(mockSolicitante);

    await expect(
      service.asignarExpediente(
        'exp-123',
        { miembroCeiId: 'usr-sol-1' },
        'admin-usr-1',
      ),
    ).rejects.toThrow(UsuarioNoEsMiembroCeiException);
  });

  it('debe lanzar MiembroCeiNoEncontradoException si el usuario no existe o está inactivo', async () => {
    mockPrisma.expediente.findFirst.mockResolvedValue(mockExpedienteIniciado);
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    await expect(
      service.asignarExpediente(
        'exp-123',
        { miembroCeiId: 'usr-fantasma' },
        'admin-usr-1',
      ),
    ).rejects.toThrow(MiembroCeiNoEncontradoException);
  });

  it('debe lanzar ExpedienteNoEncontradoException si el expediente no existe', async () => {
    mockPrisma.expediente.findFirst.mockResolvedValue(null);

    await expect(
      service.asignarExpediente(
        'exp-inexistente',
        { miembroCeiId: 'usr-vocal-1' },
        'admin-usr-1',
      ),
    ).rejects.toThrow(ExpedienteNoEncontradoException);
  });

  it('debe lanzar ExpedienteYaAsignadoException si el expediente ya está EN_EVALUACION', async () => {
    mockPrisma.expediente.findFirst.mockResolvedValue({
      ...mockExpedienteIniciado,
      estado: 'EN_EVALUACION',
    });

    await expect(
      service.asignarExpediente(
        'exp-123',
        { miembroCeiId: 'usr-vocal-1' },
        'admin-usr-1',
      ),
    ).rejects.toThrow(ExpedienteYaAsignadoException);
  });

  it('debe lanzar ExpedienteNoAptoParaAsignacionException si el expediente está RECHAZADO', async () => {
    mockPrisma.expediente.findFirst.mockResolvedValue({
      ...mockExpedienteIniciado,
      estado: 'RECHAZADO',
    });

    await expect(
      service.asignarExpediente(
        'exp-123',
        { miembroCeiId: 'usr-vocal-1' },
        'admin-usr-1',
      ),
    ).rejects.toThrow(ExpedienteNoAptoParaAsignacionException);
  });

  it('debe listar los miembros del CEI disponibles con su conteo de carga activa', async () => {
    mockPrisma.usuario.findMany.mockResolvedValue([
      {
        id: 'usr-vocal-1',
        nombre: 'Elena',
        apellido: 'Paredes',
        email: 'elena@estancia.pe',
        roles: [{ rol: { codigo: 'VOCAL_CEI' } }],
        ticketsAsignados: [{ id: 'tck-1' }, { id: 'tck-2' }],
      },
      {
        id: 'usr-sec-1',
        nombre: 'Andrés',
        apellido: 'Salazar',
        email: 'andres@estancia.pe',
        roles: [{ rol: { codigo: 'SECRETARIA_TECNICA_CEI' } }],
        ticketsAsignados: [],
      },
    ]);

    const miembros = await service.listarMiembrosCeiDisponibles();

    expect(miembros).toHaveLength(2);
    expect(miembros[0].id).toBe('usr-vocal-1');
    expect(miembros[0].cargaExpedientesActivos).toBe(2);
    expect(miembros[1].cargaExpedientesActivos).toBe(0);
  });

  it('debe listar los expedientes asignados al miembro autenticado tanto por ticket como por evaluaciones', async () => {
    mockPrisma.ticket.count.mockResolvedValue(1);
    mockPrisma.ticket.findMany.mockResolvedValue([
      {
        id: 'tck-100',
        codigo: 'TCK-2026-00100',
        expediente: { id: 'exp-100', codigo: 'EXP-2026-00100' },
      },
    ]);

    const resultado = await service.listarAsignadosAMiembroCei('usr-vocal-1', {
      page: 1,
      limit: 10,
    });

    expect(resultado.total).toBe(1);
    expect(resultado.items).toHaveLength(1);
    expect(resultado.items[0].id).toBe('tck-100');
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { asignadoAId: 'usr-vocal-1' },
            {
              expediente: {
                evaluaciones: {
                  some: { evaluadorId: 'usr-vocal-1' },
                },
              },
            },
          ],
        },
      }),
    );
  });
});
