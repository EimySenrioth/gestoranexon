import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { UserTokenService } from '../src/usermanagement/usertoken/user-token.service.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('TicketManager & DocumentManagement (e2e)', () => {
  let app: INestApplication;
  let userTokenService: UserTokenService;
  let solicitanteToken: string;
  let ceiToken: string;

  // Mock Prisma client para pruebas e2e desacopladas de la base de datos externa
  const mockTickets = new Map<string, any>();
  const mockDocs = new Map<string, any>();
  let sequenceCount = 100;

  const prismaMock = {
    $transaction: async (cb: any) => {
      const snapTickets = new Map(
        Array.from(mockTickets.entries()).map(([k, v]) => [k, { ...v }]),
      );
      const snapDocs = new Map(
        Array.from(mockDocs.entries()).map(([k, v]) => [k, { ...v }]),
      );
      try {
        return await cb(prismaMock);
      } catch (err) {
        mockTickets.clear();
        snapTickets.forEach((v, k) => mockTickets.set(k, v));
        mockDocs.clear();
        snapDocs.forEach((v, k) => mockDocs.set(k, v));
        throw err;
      }
    },
    $queryRaw: async () => [{ ultimo: ++sequenceCount }],
    ticket: {
      create: async ({ data }: any) => {
        const item = {
          id: `tck-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          creadoEn: new Date(),
          actualizadoEn: new Date(),
          documentos: [],
          historial: [],
          ...data,
        };
        mockTickets.set(item.id, item);
        return item;
      },
      findFirst: async ({ where }: any) => {
        for (const item of mockTickets.values()) {
          if (where.id && item.id !== where.id) continue;
          if (where.solicitanteId && item.solicitanteId !== where.solicitanteId) continue;
          if (where.estado && item.estado !== where.estado) continue;
          return item;
        }
        return null;
      },
      findUnique: async ({ where }: any) => {
        return mockTickets.get(where.id) || null;
      },
      findUniqueOrThrow: async ({ where }: any) => {
        const item = mockTickets.get(where.id);
        if (!item) throw new Error('Not found');
        const docs = Array.from(mockDocs.values()).filter(
          (d) => d.ticketId === where.id && d.estado !== 'REEMPLAZADO',
        );
        return { ...item, documentos: docs, tipoTramite: null };
      },
      findMany: async () => Array.from(mockTickets.values()),
      count: async () => mockTickets.size,
      update: async ({ where, data }: any) => {
        const item = mockTickets.get(where.id);
        if (!item) throw new Error('Not found');
        const updated = { ...item, ...data, actualizadoEn: new Date() };
        mockTickets.set(where.id, updated);
        return updated;
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const [id, item] of mockTickets.entries()) {
          if (where.id && item.id !== where.id) continue;
          if (where.solicitanteId && item.solicitanteId !== where.solicitanteId) continue;
          if (where.estado && item.estado !== where.estado) continue;
          if (
            where.actualizadoEn &&
            item.actualizadoEn.getTime() !== where.actualizadoEn.getTime()
          ) {
            continue;
          }
          if (
            where.resultadoEvaluacionExterna === null &&
            item.resultadoEvaluacionExterna !== null
          ) {
            continue;
          }

          mockTickets.set(id, { ...item, ...data, actualizadoEn: new Date() });
          count++;
        }
        return { count };
      },
    },
    ticketHistorial: {
      create: async ({ data }: any) => ({ id: `hist-${Date.now()}`, ...data }),
    },
    ticketDocumento: {
      findMany: async ({ where }: any) => {
        return Array.from(mockDocs.values()).filter(
          (d) => d.ticketId === where.ticketId && d.estado !== 'REEMPLAZADO',
        );
      },
      findFirst: async ({ where }: any) => {
        return (
          Array.from(mockDocs.values()).find(
            (d) =>
              d.ticketId === where.ticketId &&
              d.tipoDocumental === where.tipoDocumental &&
              d.estado !== 'REEMPLAZADO',
          ) || null
        );
      },
      create: async ({ data }: any) => {
        const item = { id: `doc-${Date.now()}`, ...data };
        mockDocs.set(item.id, item);
        return item;
      },
      update: async ({ where, data }: any) => {
        const item = mockDocs.get(where.id);
        if (item) Object.assign(item, data);
        return item;
      },
    },
    expediente: {
      create: async ({ data }: any) => ({ id: `exp-${Date.now()}`, ...data }),
    },
    documento: {
      createMany: async () => ({ count: 4 }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    userTokenService = app.get(UserTokenService);

    const solUser = await userTokenService.generateToken({
      id: 'usr-solicitante-1',
      email: 'investigador@untels.edu.pe',
      nombre: 'Dr. Investigador',
      roles: ['SOLICITANTE'],
    });
    solicitanteToken = solUser.accessToken;

    const ceiUser = await userTokenService.generateToken({
      id: 'usr-cei-1',
      email: 'presidente@untels.edu.pe',
      nombre: 'Presidente CEI',
      roles: ['PRESIDENTE_CEI'],
    });
    ceiToken = ceiUser.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Validación global (ValidationPipe forbidNonWhitelisted)', () => {
    it('debe rechazar con 400 si se envía un campo no permitido (forbidNonWhitelisted: true)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${solicitanteToken}`)
        .send({
          titulo: 'Proyecto Valido 2026',
          estado: 'EXPEDIENTE_GENERADO', // Campo prohibido en DTO
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('property estado should not exist');
    });

    it('debe rechazar con 400 si el título tiene menos de 5 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${solicitanteToken}`)
        .send({
          titulo: 'ABC',
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('título');
    });

    it('debe rechazar con 400 si tipoInvestigacion es Otro y no se envía tipoInvestigacionOtro', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${solicitanteToken}`)
        .send({
          titulo: 'Proyecto de investigación con tipo otro',
          tipoInvestigacion: 'Otro',
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('tipoInvestigacionOtro');
    });

    it('debe rechazar con 400 si financiamiento es Externo y no se envía financiamientoDetalle', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${solicitanteToken}`)
        .send({
          titulo: 'Proyecto de investigación con financiamiento externo',
          financiamiento: 'Externo',
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('financiamientoDetalle');
    });
  });

  describe('Ciclo de vida del Ticket (Creación, Edición, Cancelación y Encasillamiento)', () => {
    let createdTicketId: string;

    it('debe crear un ticket en BORRADOR exitosamente con correlativo TCK-YYYY-XXXX', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${solicitanteToken}`)
        .send({
          titulo: 'Estudio de Biotecnología Aplicada en Salud',
          investigadores: ['Dr. Investigador A', 'Dra. Investigadora B'],
          unidadAcademica: 'Facultad de Ciencias e Ingeniería',
          tipoInvestigacion: 'Tesis de posgrado',
          financiamiento: 'Autofinanciado',
          codigoSolicitante: 'EXP-MYSOL-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.estado).toBe('BORRADOR');
      expect(res.body.codigo).toMatch(/^TCK-\d{4}-\d{4}$/);
      createdTicketId = res.body.id;
    });

    it('debe permitir actualizar un ticket en BORRADOR vía PATCH', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${solicitanteToken}`)
        .send({
          titulo: 'Estudio de Biotecnología Aplicada en Salud (Actualizado)',
        });

      expect(res.status).toBe(200);
      expect(res.body.titulo).toBe(
        'Estudio de Biotecnología Aplicada en Salud (Actualizado)',
      );
    });

    it('debe rechazar el submit con 422 si no tiene los 4 documentos obligatorios', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${createdTicketId}/submit`)
        .set('Authorization', `Bearer ${solicitanteToken}`);

      expect(res.status).toBe(422);
      expect(res.body.mensaje).toBe('La solicitud no cumple los requisitos de envío');
      expect(res.body.requisitosFaltantes.length).toBe(4);
    });

    it('debe permitir cancelar el borrador vía POST /:id/cancel', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${createdTicketId}/cancel`)
        .set('Authorization', `Bearer ${solicitanteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.estado).toBe('CANCELADO');
    });

    it('debe rechazar con 409 intentar cancelar un ticket que ya no es BORRADOR', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/tickets/${createdTicketId}/cancel`)
        .set('Authorization', `Bearer ${solicitanteToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe('Stubs y callbacks del CEI', () => {
    it('debe responder 501 Not Implemented en las rutas reservadas de triaje manual', async () => {
      const resAdmit = await request(app.getHttpServer())
        .post('/api/v1/tickets/any-id/admit')
        .set('Authorization', `Bearer ${ceiToken}`);
      expect(resAdmit.status).toBe(501);

      const resReject = await request(app.getHttpServer())
        .post('/api/v1/tickets/any-id/reject')
        .set('Authorization', `Bearer ${ceiToken}`);
      expect(resReject.status).toBe(501);
    });

    it('debe rechazar callback-evaluacion si falta la cabecera X-Service-Token (401)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/tickets/any-id/callback-evaluacion')
        .send({ resultado: 'APROBADO' });

      expect(res.status).toBe(401);
    });
  });
});
