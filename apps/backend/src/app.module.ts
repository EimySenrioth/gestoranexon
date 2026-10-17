import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './database/prisma.module.js';
import { UserManagementModule } from './usermanagement/usermanagement.module.js';
import { TicketManagerModule } from './ticketmanager/ticketmanager.module.js';
import { DocumentManagementModule } from './documentmanagement/documentmanagement.module.js';
import { ExpedientesModule } from './expedientes/expedientes.module.js';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
    PrismaModule,
    UserManagementModule,
    TicketManagerModule,
    DocumentManagementModule,
    ExpedientesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
