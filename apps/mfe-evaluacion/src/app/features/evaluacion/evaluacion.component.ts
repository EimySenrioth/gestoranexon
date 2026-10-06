import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperTabsComponent } from '../../shared';
import {
  StepDatosGeneralesComponent,
  StepExpedienteComponent,
  StepAnexoComponent,
} from './steps';
import {
  StepEvaluacionId,
  DatosGeneralesProyecto,
  DocumentoExpedienteItem,
  CriterioEticoItem,
} from './models';
import { EvaluacionService } from '../../core/services';

@Component({
  selector: 'app-evaluacion, app-stepsevaluation',
  standalone: true,
  imports: [
    CommonModule,
    StepperTabsComponent,
    StepDatosGeneralesComponent,
    StepExpedienteComponent,
    StepAnexoComponent,
  ],
  templateUrl: './evaluacion.component.html',
})
export class EvaluacionComponent {
  readonly evaluacionService = inject(EvaluacionService);

  readonly steps = this.evaluacionService.steps;
  readonly currentStep = this.evaluacionService.currentStep;
  readonly datosGenerales = this.evaluacionService.datosGenerales;
  readonly documentosExpediente = this.evaluacionService.documentosExpediente;
  readonly codigoExpediente = this.evaluacionService.codigoExpediente;
  readonly criteriosEticos = this.evaluacionService.criteriosEticos;
  readonly etapasProgresoVertical = this.evaluacionService.etapasProgresoVertical;

  onStepChange(stepId: StepEvaluacionId): void {
    this.evaluacionService.setStep(stepId);
  }

  onDatosChange(nuevosDatos: DatosGeneralesProyecto): void {
    this.evaluacionService.updateDatosGenerales(nuevosDatos);
  }

  onVerDocumento(doc: DocumentoExpedienteItem): void {
    // Si hace clic en "Anexo (Aun sin evaluar)", avanzamos directamente a evaluarlo
    if (doc.id === 'anexo') {
      this.evaluacionService.setStep('anexo');
    }
  }

  onCriteriosChange(criterios: CriterioEticoItem[]): void {
    this.evaluacionService.updateCriteriosEticos(criterios);
  }

  onCancelar(): void {
    this.evaluacionService.prevStep();
  }

  onContinuar(): void {
    // Acción de continuar / siguiente etapa
    this.evaluacionService.nextStep();
  }
}
