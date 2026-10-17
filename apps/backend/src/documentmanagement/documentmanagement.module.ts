import { Module } from '@nestjs/common';
import { DocumentManagementController } from './documentmanagement.controller.js';
import { DocumentManagementService } from './documentmanagement.service.js';
import { PrismaModule } from '../database/prisma.module.js';
import { UserManagementModule } from '../usermanagement/usermanagement.module.js';

@Module({
  imports: [PrismaModule, UserManagementModule],
  controllers: [DocumentManagementController],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
