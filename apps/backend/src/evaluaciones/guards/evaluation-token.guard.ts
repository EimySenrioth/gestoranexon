import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { EvaluationTokenService } from '../services/evaluation-token.service.js';

@Injectable()
export class EvaluationTokenGuard implements CanActivate {
  constructor(private readonly tokenService: EvaluationTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Proveído por JwtAuthGuard previo

    if (!user || !user.id) {
      throw new UnauthorizedException('Sesión de usuario requerida (JWT de sesión ausente).');
    }

    const evalTokenHeader =
      request.headers['x-evaluation-token'] ||
      (request.query && request.query.token);

    if (!evalTokenHeader || typeof evalTokenHeader !== 'string') {
      throw new UnauthorizedException(
        'Token de evaluación contextual ausente (encabezado X-Evaluation-Token o query token requerido).',
      );
    }

    const evalPayload = await this.tokenService.verificarToken(evalTokenHeader);

    // 🔒 Validación Cruzada (Token Binding): La sesión de usuario debe coincidir con el sujeto del token
    if (evalPayload.sub !== user.id) {
      throw new ForbiddenException(
        'Intento de suplantación: El token de evaluación no pertenece al usuario autenticado.',
      );
    }

    // Validar concordancia de expediente si viene en parámetros o cuerpo
    const expedienteIdTarget =
      request.params?.expedienteId ||
      request.params?.id ||
      request.body?.expedienteId;

    if (
      expedienteIdTarget &&
      evalPayload.expedienteId !== expedienteIdTarget &&
      evalPayload.codigoExpediente !== expedienteIdTarget
    ) {
      throw new ForbiddenException(
        'El token de evaluación presentado no corresponde al expediente solicitado.',
      );
    }

    // Adjuntar contexto de evaluación a la solicitud
    request.evaluationContext = evalPayload;
    return true;
  }
}
