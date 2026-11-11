import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module.js';
import { UserManagementModule } from '../usermanagement/usermanagement.module.js';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller.js';
import { AdminUsuariosService } from './services/admin-usuarios.service.js';

@Module({
  imports: [PrismaModule, UserManagementModule],
  controllers: [AdminUsuariosController],
  providers: [AdminUsuariosService],
  exports: [AdminUsuariosService],
})
export class AdminUsuariosModule {}

