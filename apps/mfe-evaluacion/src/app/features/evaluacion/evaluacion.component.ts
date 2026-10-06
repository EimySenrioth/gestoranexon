import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepperTabsComponent } from '../../shared/ui/stepper-tabs';
import { StepDatosGeneralesComponent } from './steps/step-datos-generales';
import { StepEvaluacionId, DatosGeneralesProyecto } from './models';
import { EvaluacionService } from '../../core/services';

@Component({
  selector: 'app-evaluacion, app-stepsevaluation',
  standalone: true,
  imports: [CommonModule, StepperTabsComponent, StepDatosGeneralesComponent],
  templateUrl: './evaluacion.component.html',
})
export class EvaluacionComponent {
  readonly evaluacionService = inject(EvaluacionService);

  readonly steps = this.evaluacionService.steps;
  readonly currentStep = this.evaluacionService.currentStep;
  readonly datosGenerales = this.evaluacionService.datosGenerales;

  onStepChange(stepId: StepEvaluacionId): void {
    this.evaluacionService.setStep(stepId);
  }

  onDatosChange(nuevosDatos: DatosGeneralesProyecto): void {
    this.evaluacionService.updateDatosGenerales(nuevosDatos);
  }
}
