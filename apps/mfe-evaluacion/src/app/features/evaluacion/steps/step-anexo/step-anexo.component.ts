import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CriterioEticoItem,
  CriterioNormativaItem,
  RecomendacionComiteState,
  FirmaEvaluadorState,
  SubEtapaAnexoId,
  ValorCumplimiento,
} from '../../models/anexo.model';
import { EvaluacionService } from '../../../../core/services';
import { StepNormativaLegalComponent } from './sub-steps/step-normativa-legal/step-normativa-legal.component';
import { StepFirmarComponent } from './sub-steps/step-firmar/step-firmar.component';

@Component({
  selector: 'app-step-anexo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StepNormativaLegalComponent,
    StepFirmarComponent,
  ],
  templateUrl: './step-anexo.component.html',
})
export class StepAnexoComponent {
  readonly evaluacionService = inject(EvaluacionService);

  readonly subEtapa = this.evaluacionService.subEtapaAnexo;
  readonly etapas = this.evaluacionService.etapasProgresoVertical;
  readonly criteriosEticos = this.evaluacionService.criteriosEticos;
  readonly criteriosNormativa = this.evaluacionService.criteriosNormativa;
  readonly recomendacionComite = this.evaluacionService.recomendacionComite;
  readonly firmaEvaluador = this.evaluacionService.firmaEvaluador;

  // --- Navegación Stepper Vertical ---
  onSelectEtapa(subEtapaId?: SubEtapaAnexoId): void {
    if (subEtapaId) {
      this.evaluacionService.setSubEtapaAnexo(subEtapaId);
    }
  }

  // --- Sub-Etapa 1: Principios Éticos ---
  toggleCumplimientoEtico(criterio: CriterioEticoItem, valor: ValorCumplimiento): void {
    const list = [...this.criteriosEticos()];
    const item = list.find((c) => c.id === criterio.id);
    if (item) {
      item.cumplimiento = item.cumplimiento === valor ? null : valor;
      this.evaluacionService.updateCriteriosEticos(list);
    }
  }

  onObservacionesEticasChange(criterio: CriterioEticoItem, valor: string): void {
    const list = [...this.criteriosEticos()];
    const item = list.find((c) => c.id === criterio.id);
    if (item) {
      item.observaciones = valor;
      this.evaluacionService.updateCriteriosEticos(list);
    }
  }

  // --- Sub-Etapa 2: Normativa Legal y Recomendaciones del Comité ---
  onCriteriosNormativaChange(criterios: CriterioNormativaItem[]): void {
    this.evaluacionService.updateCriteriosNormativa(criterios);
  }

  onRecomendacionChange(rec: RecomendacionComiteState): void {
    this.evaluacionService.updateRecomendacionComite(rec);
  }

  // --- Sub-Etapa 3: Firma Digital ---
  onFirmaChange(firma: FirmaEvaluadorState): void {
    this.evaluacionService.updateFirmaEvaluador(firma);
  }

  onFinalizarFirma(firma: FirmaEvaluadorState): void {
    this.evaluacionService.updateFirmaEvaluador({ ...firma, firmado: true });
  }

  // --- Botones de Cancelar y Continuar entre sub-etapas ---
  onCancelar(): void {
    this.evaluacionService.retrocederSubEtapaAnexo();
  }

  onContinuar(): void {
    this.evaluacionService.avanzarSubEtapaAnexo();
  }
}
