import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { BaseException, ErrorResponseBody } from './base.exception.js';
import { esErrorConexionBD, esViolacionUnica } from '../utils/db-error.util.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // 1. Instancias directas de BaseException (tienen código y mensaje semántico)
    if (exception instanceof BaseException) {
      const status = exception.getStatus();
      const res = exception.getResponse() as ErrorResponseBody;
      return response.status(status).json(res);
    }

    // 2. Errores de Base de Datos conocidos (caída o duplicidad de clave)
    if (esErrorConexionBD(exception)) {
      this.logger.error('Fallo de conexión con la base de datos', exception);
      return response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        codigo: 'SYS-001',
        message: 'Servicio de base de datos no disponible',
      });
    }

    if (esViolacionUnica(exception)) {
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        codigo: 'SYS-003',
        message: 'El registro ya existe en la base de datos',
      });
    }

    // 3. Otras HttpExceptions de NestJS (ValidationPipe u otras rutas legacy)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const rawResponse = exception.getResponse();

      let message = exception.message;
      let detalle: unknown = undefined;

      if (typeof rawResponse === 'object' && rawResponse !== null) {
        const bodyObj = rawResponse as Record<string, unknown>;
        if (Array.isArray(bodyObj.message)) {
          // Errores de ValidationPipe de class-validator
          message = 'Datos de entrada inválidos';
          detalle = bodyObj.message;
        } else if (typeof bodyObj.message === 'string') {
          message = bodyObj.message;
        }
      }

      const codigo = status === 400 ? 'VAL-001' : `HTTP-${status}`;

      return response.status(status).json({
        statusCode: status,
        codigo,
        message,
        ...(detalle !== undefined ? { detalle } : {}),
      });
    }

    // 4. Errores desconocidos (500) sin filtrar trazas internas al cliente
    this.logger.error('Error no controlado en el servidor', exception);

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      codigo: 'SYS-002',
      message: 'Error interno del servidor',
    });
  }
}
