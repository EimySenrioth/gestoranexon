import {
  Component,
  EventEmitter,
  Output,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EvaluacionService } from '../../../../core/services';
import {
  TipoResumenVista,
  DocumentoResumenItem,
  DOCUMENTOS_RESUMEN_INICIALES,
  FilaResumenEtica,
} from '../../models';

@Component({
  selector: 'app-step-resumen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './step-resumen.component.html',
})
export class StepResumenComponent {
  readonly evaluacionService = inject(EvaluacionService);

  @Output() anterior = new EventEmitter<void>();
  @Output() completar = new EventEmitter<void>();

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.menuAbiertoDocId()) {
      this.menuAbiertoDocId.set(null);
    }
  }

  // Sub-vista activa: 'expediente' (CEI-2026-0163) o 'anexo' (ANEXO N°9)
  readonly subVista = signal<TipoResumenVista>('expediente');

  // ID del documento cuyo menú desplegable está abierto actualmente (null si ninguno)
  readonly menuAbiertoDocId = signal<string | null>(null);

  // Código de expediente
  readonly codigoExpediente = this.evaluacionService.codigoExpediente;

  // Lista de documentos del expediente
  readonly documentos = signal<DocumentoResumenItem[]>([...DOCUMENTOS_RESUMEN_INICIALES]);

  // Principios éticos evaluados en el paso Anexo para alimentar la tabla
  readonly criteriosEticos = this.evaluacionService.criteriosEticos;

  // Filas calculadas para la tabla de Anexo N°9
  readonly filasTablaAnexo = computed<FilaResumenEtica[]>(() => {
    return this.criteriosEticos().map((criterio) => {
      const cumple = criterio.cumplimiento === 'cumple' ? 'Si' : '';
      const noCumple = criterio.cumplimiento === 'no_cumple' ? 'No' : '';
      const obs = criterio.observaciones?.trim()
        ? criterio.observaciones
        : (criterio.cumplimiento === 'no_cumple' ? 'Detalles' : '');
      return {
        principio: criterio.titulo,
        cumple,
        noCumple,
        observaciones: obs,
      };
    });
  });

  onSelectVista(vista: TipoResumenVista): void {
    this.subVista.set(vista);
    this.menuAbiertoDocId.set(null);
  }

  toggleMenuDoc(docId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.menuAbiertoDocId.update((actual) => (actual === docId ? null : docId));
  }

  onVerDoc(doc: DocumentoResumenItem, event?: MouseEvent): void {
    event?.stopPropagation();
    this.menuAbiertoDocId.set(null);
    if (doc.id === 'anexo') {
      this.evaluacionService.setStep('anexo');
    } else {
      this.evaluacionService.setStep('expediente');
    }
  }

  onActualizarDoc(doc: DocumentoResumenItem, event?: MouseEvent): void {
    event?.stopPropagation();
    this.menuAbiertoDocId.set(null);
  }

  onAnterior(): void {
    this.anterior.emit();
  }

  onCompletar(): void {
    this.completar.emit();
  }
}
