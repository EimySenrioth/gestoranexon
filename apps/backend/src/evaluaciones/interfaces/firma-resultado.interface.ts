export interface FirmaResultado {
  id: string;
  evaluacionId: string;
  firmadoPor: string;
  nombreFirmante?: string;
  emailFirmante?: string;
  firmaDataUrl: string;
  hashSha256: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  creadoEn: Date;
}

