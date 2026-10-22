import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponseBody {
  statusCode: number;
  codigo: string;
  message: string;
  detalle?: unknown;
}

export class BaseException extends HttpException {
  constructor(
    statusCode: HttpStatus,
    public readonly codigo: string,
    message: string,
    public readonly detalle?: unknown,
  ) {
    const responseBody: ErrorResponseBody = {
      statusCode,
      codigo,
      message,
      ...(detalle !== undefined ? { detalle } : {}),
    };
    super(responseBody, statusCode);
  }
}
