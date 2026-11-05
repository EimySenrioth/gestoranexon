import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DocumentoExpedienteItem,
  DEFAULT_EXPEDIENTE_PROYECTO,
} from '../../models/expediente.model';
import { EvaluationSessionService } from '../../../../core/services/evaluation-session.service';

@Component({
  selector: 'app-step-expediente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-expediente.component.html',
})
export class StepExpedienteComponent {
  private readonly sessionService = inject(EvaluationSessionService);

  @Input() documentos: DocumentoExpedienteItem[] =
    DEFAULT_EXPEDIENTE_PROYECTO.documentos;
  @Input() codigoExpediente: string = DEFAULT_EXPEDIENTE_PROYECTO.codigoExpediente;

  @Output() verDocumento = new EventEmitter<DocumentoExpedienteItem>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<void>();

  onAbrirPdf(doc: DocumentoExpedienteItem, event: MouseEvent): void {
    event.stopPropagation();

    // Si hace clic en "Anexo (Aun sin evaluar)", avanzamos directamente a evaluarlo
    if (doc.id === 'anexo' && !doc.pdfUrl && !doc.url) {
      this.verDocumento.emit(doc);
      return;
    }

    let url = doc.pdfUrl || doc.url || `http://localhost:3000/api/v1/documents/${encodeURIComponent(doc.id)}/view`;

    if (typeof window !== 'undefined') {
      const token =
        this.sessionService.accessToken() ||
        this.sessionService.token() ||
        '';

      if (token && !url.includes('token=')) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}token=${encodeURIComponent(token)}`;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onContinuar(): void {
    this.continuar.emit();
  }
}
