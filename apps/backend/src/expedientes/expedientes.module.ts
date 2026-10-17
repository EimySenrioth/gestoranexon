import { Module } from '@nestjs/common';
import { ExpedientesService } from './expedientes.service.js';
import { ExpedientesController } from './expedientes.controller.js';
import { PrismaModule } from '../database/prisma.module.js';
import { UserManagementModule } from '../usermanagement/usermanagement.module.js';

@Module({
  imports: [PrismaModule, UserManagementModule],
  controllers: [ExpedientesController],
  providers: [ExpedientesService],
  exports: [ExpedientesService],
})
export class ExpedientesModule {}
