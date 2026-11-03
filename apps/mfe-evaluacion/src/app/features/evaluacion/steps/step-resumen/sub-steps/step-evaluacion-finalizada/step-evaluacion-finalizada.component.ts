import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-step-evaluacion-finalizada',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-evaluacion-finalizada.component.html',
})
export class StepEvaluacionFinalizadaComponent implements OnInit, OnDestroy {
  @Input() codigoExpediente = '';
  @Output() tiempoAgotado = new EventEmitter<void>();

  readonly segundosRestantes = signal<number>(5);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.iniciarCuentaRegresiva();
  }

  private iniciarCuentaRegresiva(): void {
    this.segundosRestantes.set(5);
    this.intervalId = setInterval(() => {
      const actual = this.segundosRestantes();
      if (actual <= 1) {
        this.segundosRestantes.set(0);
        this.limpiarTemporizador();
        this.tiempoAgotado.emit();
      } else {
        this.segundosRestantes.set(actual - 1);
      }
    }, 1000);
  }

  irAhora(): void {
    this.limpiarTemporizador();
    this.tiempoAgotado.emit();
  }

  private limpiarTemporizador(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  ngOnDestroy(): void {
    this.limpiarTemporizador();
  }
}
