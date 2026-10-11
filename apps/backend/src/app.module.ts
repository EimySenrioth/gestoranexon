import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './database/prisma.module.js';
import { UserManagementModule } from './usermanagement/usermanagement.module.js';

@Module({
  imports: [PrismaModule, UserManagementModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

