import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CriterioNormativaItem,
  CRITERIOS_NORMATIVA_INICIALES,
  RecomendacionComiteState,
  DEFAULT_RECOMENDACION_COMITE,
  DictamenComite,
  ValorCumplimiento,
} from '../../../../models';

@Component({
  selector: 'app-step-normativa-legal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-normativa-legal.component.html',
})
export class StepNormativaLegalComponent {
  @Input() criterios: CriterioNormativaItem[] = [...CRITERIOS_NORMATIVA_INICIALES];
  @Input() recomendacion: RecomendacionComiteState = { ...DEFAULT_RECOMENDACION_COMITE };

  @Output() criteriosChange = new EventEmitter<CriterioNormativaItem[]>();
  @Output() recomendacionChange = new EventEmitter<RecomendacionComiteState>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<void>();

  mostrarAyudaComite = false;

  toggleCumplimiento(criterio: CriterioNormativaItem, valor: ValorCumplimiento): void {
    criterio.cumplimiento = criterio.cumplimiento === valor ? null : valor;
    this.criteriosChange.emit(this.criterios);
  }

  onObservacionChange(criterio: CriterioNormativaItem, valor: string): void {
    criterio.observaciones = valor;
    this.criteriosChange.emit(this.criterios);
  }

  onDictamenChange(nuevoDictamen: DictamenComite): void {
    this.recomendacion.dictamen = nuevoDictamen;
    this.recomendacionChange.emit(this.recomendacion);
  }

  onObservacionComiteChange(valor: string): void {
    this.recomendacion.observaciones = valor;
    this.recomendacionChange.emit(this.recomendacion);
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onContinuar(): void {
    this.continuar.emit();
  }
}
