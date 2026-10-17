import { Module } from '@nestjs/common';
import { TicketManagerController } from './ticketmanager.controller.js';
import { TicketManagerService } from './ticketmanager.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { UserManagementModule } from '../usermanagement/usermanagement.module.js';

@Module({
  imports: [PrismaModule, UserManagementModule],
  controllers: [TicketManagerController],
  providers: [TicketManagerService],
  exports: [TicketManagerService],
})
export class TicketManagerModule {}
