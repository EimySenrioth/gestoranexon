import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirmaEvaluadorState, DEFAULT_FIRMA_EVALUADOR } from '../../../../models';

@Component({
  selector: 'app-step-anexo-finalizado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-anexo-finalizado.component.html',
})
export class StepAnexoFinalizadoComponent {
  @Input() firmaState: FirmaEvaluadorState = { ...DEFAULT_FIRMA_EVALUADOR };
  @Output() continuarAResumen = new EventEmitter<void>();

  onContinuar(): void {
    this.continuarAResumen.emit();
  }
}
