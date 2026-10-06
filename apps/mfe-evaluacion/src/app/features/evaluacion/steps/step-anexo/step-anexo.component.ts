import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CriterioEticoItem,
  CRITERIOS_ETICOS_INICIALES,
  EtapaProgresoVertical,
  ETAPAS_PROGRESO_VERTICAL,
  ValorCumplimiento,
} from '../../models/anexo.model';

@Component({
  selector: 'app-step-anexo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-anexo.component.html',
})
export class StepAnexoComponent {
  @Input() criterios: CriterioEticoItem[] = [...CRITERIOS_ETICOS_INICIALES];
  @Input() etapas: EtapaProgresoVertical[] = [...ETAPAS_PROGRESO_VERTICAL];

  @Output() criteriosChange = new EventEmitter<CriterioEticoItem[]>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<CriterioEticoItem[]>();

  toggleCumplimiento(criterio: CriterioEticoItem, valor: ValorCumplimiento): void {
    criterio.cumplimiento = criterio.cumplimiento === valor ? null : valor;
    this.criteriosChange.emit(this.criterios);
  }

  toggleAyuda(criterio: CriterioEticoItem): void {
    criterio.mostrarAyuda = !criterio.mostrarAyuda;
  }

  onObservacionesChange(criterio: CriterioEticoItem, valor: string): void {
    criterio.observaciones = valor;
    this.criteriosChange.emit(this.criterios);
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onContinuar(): void {
    this.continuar.emit(this.criterios);
  }
}
