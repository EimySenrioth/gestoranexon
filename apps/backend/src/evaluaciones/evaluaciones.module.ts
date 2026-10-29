import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../database/prisma.module.js';
import { UserManagementModule } from '../usermanagement/usermanagement.module.js';
import {
  EvaluationTokenService,
  AnexoEvaluacionService,
  FirmaService,
} from './services/index.js';
import {
  EvaluationTokenController,
  AnexoEvaluacionController,
  FirmaController,
} from './controllers/index.js';
import { EvaluationTokenGuard } from './guards/evaluation-token.guard.js';

@Module({
  imports: [
    PrismaModule,
    UserManagementModule,
    JwtModule.register({
      secret:
        process.env.EVALUATION_TOKEN_SECRET ||
        process.env.JWT_SECRET ||
        'estanciaperu_jwt_super_secret_key_2026',
      signOptions: { expiresIn: '2h' },
    }),
  ],
  controllers: [
    EvaluationTokenController,
    AnexoEvaluacionController,
    FirmaController,
  ],
  providers: [
    EvaluationTokenService,
    AnexoEvaluacionService,
    FirmaService,
    EvaluationTokenGuard,
  ],
  exports: [
    EvaluationTokenService,
    AnexoEvaluacionService,
    FirmaService,
    EvaluationTokenGuard,
  ],
})
export class EvaluacionesModule {}
