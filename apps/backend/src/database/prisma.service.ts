import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export * from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://estancia_user:estancia_pass@localhost:5432/estanciaperu_db?schema=public';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexión establecida con la base de datos PostgreSQL.');
    } catch (error) {
      this.logger.warn(
        'No se pudo conectar a PostgreSQL en el puerto 5432. El servidor NestJS seguirá activo, pero asegúrese de tener la base de datos levantada (Docker/PostgreSQL).'
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
