import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserManagementController, CsrfGuard } from './usermanagement.controller.js';
import { UserManagementService } from './usermanagement.service.js';
import { UserTokenService } from './usertoken/user-token.service.js';
import { RefreshTokenService } from './refreshtoken/refresh-token.service.js';

import { JwtAuthGuard, RolesGuard, ServiceTokenGuard } from './guards/index.js';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'estanciaperu_jwt_super_secret_key_2026',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [UserManagementController],
  providers: [
    UserManagementService,
    UserTokenService,
    RefreshTokenService,
    CsrfGuard,
    JwtAuthGuard,
    RolesGuard,
    ServiceTokenGuard,
  ],
  exports: [
    UserManagementService,
    UserTokenService,
    RefreshTokenService,
    JwtAuthGuard,
    RolesGuard,
    ServiceTokenGuard,
  ],
})
export class UserManagementModule {}
