import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirmaEvaluadorState, DEFAULT_FIRMA_EVALUADOR } from '../../../../models';

@Component({
  selector: 'app-step-firmar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-firmar.component.html',
})
export class StepFirmarComponent implements AfterViewInit {
  @Input() firmaState: FirmaEvaluadorState = { ...DEFAULT_FIRMA_EVALUADOR };

  @Output() firmaChange = new EventEmitter<FirmaEvaluadorState>();
  @Output() cancelar = new EventEmitter<void>();
  @Output() firmar = new EventEmitter<FirmaEvaluadorState>();

  @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx: CanvasRenderingContext2D | null = null;
  private isDrawing = false;
  hasDrawn = false;
  mensajeExito = false;

  password = '';

  ngAfterViewInit(): void {
    this.initCanvas();
  }

  private initCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    // Set actual drawing buffer dimensions to match client width/height
    canvas.width = canvas.parentElement?.clientWidth || 500;
    canvas.height = 200;

    this.ctx = canvas.getContext('2d');
    if (this.ctx) {
      this.ctx.lineWidth = 2.5;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
    }

    // Si ya había una firma previa en Base64, restaurarla
    if (this.firmaState.firmaDataUrl && this.ctx) {
      const img = new Image();
      img.onload = () => {
        this.ctx?.drawImage(img, 0, 0);
        this.hasDrawn = true;
      };
      img.src = this.firmaState.firmaDataUrl;
    }
  }

  // --- Manejo del dibujo con Ratón ---
  startDrawing(event: MouseEvent): void {
    if (!this.ctx) return;
    this.isDrawing = true;
    this.hasDrawn = true;
    const { x, y } = this.getCoords(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(event: MouseEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    const { x, y } = this.getCoords(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stopDrawing(): void {
    if (this.isDrawing && this.ctx) {
      this.isDrawing = false;
      this.ctx.closePath();
      this.guardarFirmaEnState();
    }
  }

  // --- Manejo del dibujo táctil (Touch) ---
  startDrawingTouch(event: TouchEvent): void {
    event.preventDefault();
    if (!this.ctx || event.touches.length === 0) return;
    this.isDrawing = true;
    this.hasDrawn = true;
    const touch = event.touches[0];
    const { x, y } = this.getTouchCoords(touch);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  drawTouch(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing || !this.ctx || event.touches.length === 0) return;
    const touch = event.touches[0];
    const { x, y } = this.getTouchCoords(touch);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  stopDrawingTouch(): void {
    this.stopDrawing();
  }

  borrarFirma(): void {
    const canvas = this.canvasRef.nativeElement;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    this.hasDrawn = false;
    this.guardarFirmaEnState('');
  }

  private getCoords(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private getTouchCoords(touch: Touch): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  private guardarFirmaEnState(dataUrlOverride?: string): void {
    const canvas = this.canvasRef.nativeElement;
    const dataUrl = dataUrlOverride !== undefined ? dataUrlOverride : canvas.toDataURL('image/png');
    this.firmaState.firmaDataUrl = dataUrl;
    this.firmaState.password = this.password;
    this.firmaChange.emit(this.firmaState);
  }

  onPasswordChange(): void {
    this.guardarFirmaEnState();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }

  onFirmar(): void {
    this.guardarFirmaEnState();
    this.firmaState.firmado = true;
    this.mensajeExito = true;
    this.firmar.emit(this.firmaState);
  }
}
