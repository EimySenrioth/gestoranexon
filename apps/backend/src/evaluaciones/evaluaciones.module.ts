import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../database/prisma.module.js';
import { UserManagementModule } from '../usermanagement/usermanagement.module.js';
import { EvaluationTokenService } from './services/evaluation-token.service.js';
import { AnexoEvaluacionService } from './services/anexo-evaluacion.service.js';
import { EvaluationTokenController } from './controllers/evaluation-token.controller.js';
import { AnexoEvaluacionController } from './controllers/anexo-evaluacion.controller.js';
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
  controllers: [EvaluationTokenController, AnexoEvaluacionController],
  providers: [
    EvaluationTokenService,
    AnexoEvaluacionService,
    EvaluationTokenGuard,
  ],
  exports: [
    EvaluationTokenService,
    AnexoEvaluacionService,
    EvaluationTokenGuard,
  ],
})
export class EvaluacionesModule {}
