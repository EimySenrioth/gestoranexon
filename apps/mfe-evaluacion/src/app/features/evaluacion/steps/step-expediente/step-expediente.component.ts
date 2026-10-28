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
  @Output() cancelar = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<void>();

  onVerClick(item: DocumentoExpedienteItem): void {
    this.verDocumento.emit(item);
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onContinuar(): void {
    this.continuar.emit();
  }
}
