import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DocumentoExpedienteItem,
  DEFAULT_EXPEDIENTE_PROYECTO,
} from '../../models/expediente.model';

@Component({
  selector: 'app-step-expediente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-expediente.component.html',
})
export class StepExpedienteComponent {
  @Input() documentos: DocumentoExpedienteItem[] =
    DEFAULT_EXPEDIENTE_PROYECTO.documentos;
  @Input() codigoExpediente: string = DEFAULT_EXPEDIENTE_PROYECTO.codigoExpediente;

  @Output() verDocumento = new EventEmitter<DocumentoExpedienteItem>();

  onVerClick(item: DocumentoExpedienteItem): void {
    this.verDocumento.emit(item);
  }
}
