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
 * Datos mock de evaluación para estandarizar el tamaño de las cápsulas
 */
export const MOCK_DATOS_GENERALES: DatosGeneralesProyecto = {
  tituloProyecto: 'Plataforma Telemedicina IA',
  investigadoresResponsables: 'Dr. Carlos Mendoza V.',
  unidadAcademicaFacultad: 'Facultad de Ingeniería',
  tipoInvestigacion: 'Investigación Aplicada',
  fechaPresentacion: '14 de Octubre, 2026',
  financiamiento: 'Subvención UNTELS',
};

/**
 * Valores iniciales por defecto
 */
export const DEFAULT_DATOS_GENERALES: DatosGeneralesProyecto = {
  ...MOCK_DATOS_GENERALES,
};
