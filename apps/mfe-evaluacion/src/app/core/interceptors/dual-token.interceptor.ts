import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { EvaluationSessionService } from '../services/evaluation-session.service';

export const dualTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(EvaluationSessionService);
  const evaluationToken = sessionService.token();
  const accessToken = sessionService.accessToken();

  let headers = req.headers.set('X-Requested-With', 'EstanciaPeru');

  if (accessToken && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${accessToken}`);
  } else if (evaluationToken && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${evaluationToken}`);
  }

  if (evaluationToken) {
    headers = headers.set('X-Evaluation-Token', evaluationToken);
  }

  // Clonar la solicitud con los encabezados de autenticación y credenciales habilitadas
  const authReq = req.clone({
    headers,
    withCredentials: true,
  });

  return next(authReq);
};
