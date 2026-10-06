import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatosGeneralesProyecto, DEFAULT_DATOS_GENERALES } from '../../models/datos-generales.model';

interface CampoItem {
  id: keyof DatosGeneralesProyecto;
  label: string;
}

@Component({
  selector: 'app-step-datos-generales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-datos-generales.component.html',
})
export class StepDatosGeneralesComponent {
  @Input() datos: DatosGeneralesProyecto = { ...DEFAULT_DATOS_GENERALES };
  @Output() datosChange = new EventEmitter<DatosGeneralesProyecto>();

  readonly campos: CampoItem[] = [
    { id: 'tituloProyecto', label: 'Título del Proyecto' },
    { id: 'investigadoresResponsables', label: 'Investigador(es) Responsable(s)' },
    { id: 'unidadAcademicaFacultad', label: 'Unidad Académica / Facultad' },
    { id: 'tipoInvestigacion', label: 'Tipo de Investigación' },
    { id: 'fechaPresentacion', label: 'Fecha de Presentación' },
    { id: 'financiamiento', label: 'Financiamiento' },
  ];
}
