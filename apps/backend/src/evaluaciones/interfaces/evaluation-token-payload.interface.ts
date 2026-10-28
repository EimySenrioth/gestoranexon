export interface EvaluationTokenPayload {
  jti: string;            // Identificador único de sesión de evaluación
  sub: string;            // ID del evaluador (debe coincidir con Usuario.id)
  expedienteId: string;   // ID del expediente asignado
  ticketId?: string;      // ID del ticket origen
  rol?: string;           // Rol en el comité (e.g. VOCAL_CEI, PRESIDENTE_CEI)
  tipoAnexo: string;      // 'ANEXO_9'
  iat?: number;           // Timestamp de emisión
  exp?: number;           // Expiración
}
