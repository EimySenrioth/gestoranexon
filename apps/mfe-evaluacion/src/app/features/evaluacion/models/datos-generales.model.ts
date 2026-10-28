/**
 * Modelo de datos para el Paso 1: DATOS GENERALES DEL PROYECTO
 */
export interface DatosGeneralesProyecto {
  tituloProyecto: string;
  investigadoresResponsables: string;
  unidadAcademicaFacultad: string;
  tipoInvestigacion: string;
  fechaPresentacion: string;
  financiamiento: string;
}

/**
 * Valores iniciales limpios (se pueblan dinámicamente desde el endpoint del backend)
 */
export const DEFAULT_DATOS_GENERALES: DatosGeneralesProyecto = {
  tituloProyecto: 'Cargando datos del proyecto...',
  investigadoresResponsables: 'Cargando...',
  unidadAcademicaFacultad: 'Cargando...',
  tipoInvestigacion: 'Cargando...',
  fechaPresentacion: 'Cargando...',
  financiamiento: 'Cargando...',
};

