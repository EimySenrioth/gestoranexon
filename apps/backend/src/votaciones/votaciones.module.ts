import { Module } from '@nestjs/common';
import { VotacionesService } from './services/votaciones.service.js';
import { VotacionesController } from './controllers/votaciones.controller.js';
import { VotacionesGateway } from './gateways/votaciones.gateway.js';
import { PrismaModule } from '../database/prisma.module.js';
import { UserManagementModule } from '../usermanagement/usermanagement.module.js';

@Module({
  imports: [PrismaModule, UserManagementModule],
  controllers: [VotacionesController],
  providers: [VotacionesService, VotacionesGateway],
  exports: [VotacionesService, VotacionesGateway],
})
export class VotacionesModule {}
