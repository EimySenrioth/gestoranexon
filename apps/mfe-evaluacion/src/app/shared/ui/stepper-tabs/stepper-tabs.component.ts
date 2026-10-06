import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StepItem, StepEvaluacionId, EVALUACION_STEPS } from '../../../features/evaluacion/models';

@Component({
  selector: 'app-stepper-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper-tabs.component.html',
})
export class StepperTabsComponent {
  @Input() steps: StepItem[] = EVALUACION_STEPS;
  @Input() currentStep: StepEvaluacionId = 'datos-generales';
  @Output() stepChange = new EventEmitter<StepEvaluacionId>();

  onSelectStep(step: StepItem): void {
    if (step.disabled) return;
    this.stepChange.emit(step.id);
  }
}
