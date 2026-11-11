import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module.js';
import { NewUsersController } from './controllers/newusers.controller.js';
import { NewUsersService } from './services/newusers.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [NewUsersController],
  providers: [NewUsersService],
  exports: [NewUsersService],
})
export class NewUsersModule {}

