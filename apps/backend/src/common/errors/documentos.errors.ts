import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception.js';

export class ArchivoRequeridoException extends BaseException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, 'DOC-001', 'Debe enviar un archivo en el campo "file"');
  }
}

export class FormatoAudioInvalidoException extends BaseException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, 'DOC-002', 'El archivo de audio debe ser en formato MP3.');
  }
}

export class DocumentoNoEncontradoException extends BaseException {
  constructor(id?: string) {
    super(
      HttpStatus.NOT_FOUND,
      'DOC-003',
      'Documento no encontrado',
      id ? { id } : undefined,
    );
  }
}

export class PermisosDocumentoDenegadosException extends BaseException {
  constructor() {
    super(HttpStatus.FORBIDDEN, 'DOC-004', 'No tiene permisos para acceder a este documento');
  }
}

export class ArchivoFisicoNoEncontradoException extends BaseException {
  constructor() {
    super(HttpStatus.NOT_FOUND, 'DOC-005', 'El archivo físico no fue encontrado en el servidor');
  }
}
