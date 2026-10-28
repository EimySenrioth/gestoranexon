import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EvaluationSessionService } from '../services/evaluation-session.service';

export const dualTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(EvaluationSessionService);
  const evaluationToken = sessionService.token();

  let headers = req.headers;

  if (evaluationToken) {
    headers = headers.set('X-Evaluation-Token', evaluationToken);
  }

  // Clonar la solicitud con el encabezado de evaluación y credenciales habilitadas
  const authReq = req.clone({
    headers,
    withCredentials: true,
  });

  return next(authReq);
};
