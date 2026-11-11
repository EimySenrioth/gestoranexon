import type {
  AdminUsuarioFilaDto,
  CategoriaUsuarioAdmin,
} from '../dto/admin-usuario-response.dto.js';

export const ROLES_EVALUADORES_IDS = [2, 3, 4, 5, 6, 7];
export const ROLES_SOLICITANTES_IDS = [1];
export const ROLES_ADMINISTRADORES_IDS = [8];
export const ROLES_CREACION_PERMITIDOS_IDS = [1, 8]; // 1 = SOLICITANTE, 8 = ADMINISTRADOR

const COLORES_POR_ROL: Record<string, string> = {
  PRESIDENTE_CEI: '#5c2d91',
  VICEPRESIDENTE_CEI: '#0078d4',
  SECRETARIA_TECNICA_CEI: '#008272',
  SECRETARIA_TECNICA: '#008272',
  SECRETARIA_ADMINISTRATIVA_CEI: '#b4009e',
  SECRETARIA_ADMINISTRATIVA: '#b4009e',
  VOCAL_CEI: '#107c10',
  EVALUADOR: '#d83b01',
  ADMINISTRADOR: '#242424',
  SOLICITANTE: '#0078d4',
};

const PALETA_AVATAR_FALLBACK = [
  '#0078d4',
  '#5c2d91',
  '#008272',
  '#107c10',
  '#8e562e',
  '#004b50',
  '#498205',
  '#b4009e',
];

export function calcularIniciales(nombre: string, apellido: string): string {
  const limpiarPrefijos = (str: string) =>
    str
      .replace(/^(dr\.|dra\.|mg\.|lic\.|ing\.|bach\.|est\.)\s+/i, '')
      .trim();

  const nLimpio = limpiarPrefijos(nombre || '');
  const aLimpio = limpiarPrefijos(apellido || '');

  const primeraLetraNombre = nLimpio.charAt(0).toUpperCase();
  const primeraLetraApellido = aLimpio.charAt(0).toUpperCase();

  if (primeraLetraNombre && primeraLetraApellido) {
    return `${primeraLetraNombre}${primeraLetraApellido}`;
  }

  const partes = `${nLimpio} ${aLimpio}`
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length >= 2) {
    return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase();
  }
  if (partes.length === 1 && partes[0].length > 0) {
    return partes[0].slice(0, 2).toUpperCase();
  }
  return 'US';
}

export function calcularAvatarColor(id: string, rolCodigo: string): string {
  if (rolCodigo !== 'SOLICITANTE' && COLORES_POR_ROL[rolCodigo]) {
    return COLORES_POR_ROL[rolCodigo];
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETA_AVATAR_FALLBACK.length;
  return PALETA_AVATAR_FALLBACK[index];
}

export function mapPrismaUsuarioToAdminFila(
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    password?: string | null;
    activo: boolean;
    creadoEn: Date | string;
    roles?: Array<{
      rolId?: number;
      rol: {
        id: number;
        codigo: string;
        nombre: string;
      };
    }>;
  },
  categoriaForzada?: CategoriaUsuarioAdmin,
): AdminUsuarioFilaDto {
  const rolesUsuario = usuario.roles?.map((r) => r.rol) ?? [];

  // Priorizar rol según categoría si el usuario tuviera más de uno
  let rolPrincipal = rolesUsuario[0];
  if (categoriaForzada === 'EVALUADOR') {
    rolPrincipal =
      rolesUsuario.find((r) => ROLES_EVALUADORES_IDS.includes(r.id)) ??
      rolPrincipal;
  } else if (categoriaForzada === 'SOLICITANTE') {
    rolPrincipal =
      rolesUsuario.find((r) => ROLES_SOLICITANTES_IDS.includes(r.id)) ??
      rolPrincipal;
  } else if (categoriaForzada === 'ADMINISTRADOR') {
    rolPrincipal =
      rolesUsuario.find(
        (r) =>
          ROLES_ADMINISTRADORES_IDS.includes(r.id) ||
          r.codigo === 'ADMINISTRADOR',
      ) ?? rolPrincipal;
  }

  const rolId =
    rolPrincipal?.id ??
    (categoriaForzada === 'EVALUADOR'
      ? 2
      : categoriaForzada === 'ADMINISTRADOR'
        ? 8
        : 1);
  const rolCodigo =
    rolPrincipal?.codigo ??
    (categoriaForzada === 'EVALUADOR'
      ? 'EVALUADOR'
      : categoriaForzada === 'ADMINISTRADOR'
        ? 'ADMINISTRADOR'
        : 'SOLICITANTE');
  const rolEtiqueta =
    rolPrincipal?.nombre ??
    (categoriaForzada === 'EVALUADOR'
      ? 'Evaluador de Proyectos'
      : categoriaForzada === 'ADMINISTRADOR'
        ? 'Administrador'
        : 'Solicitante / Investigador');

  const esEvaluador = ROLES_EVALUADORES_IDS.includes(rolId);
  const esAdministrador =
    ROLES_ADMINISTRADORES_IDS.includes(rolId) || rolCodigo === 'ADMINISTRADOR';
  const categoria: CategoriaUsuarioAdmin =
    categoriaForzada ??
    (esAdministrador
      ? 'ADMINISTRADOR'
      : esEvaluador
        ? 'EVALUADOR'
        : 'SOLICITANTE');

  const nombre = (usuario.nombre || '').trim();
  const apellido = (usuario.apellido || '').trim();
  const nombreCompleto = `${nombre} ${apellido}`.trim() || usuario.email;

  const creadoDate =
    usuario.creadoEn instanceof Date
      ? usuario.creadoEn
      : new Date(usuario.creadoEn || Date.now());
  const creadoEnIso = creadoDate.toISOString();
  const fechaRegistro = creadoEnIso.split('T')[0];

  const passwordReal =
    typeof usuario.password === 'string' && usuario.password.trim().length > 0
      ? usuario.password.trim()
      : 'Estancia2026!#';

  return {
    id: usuario.id,
    nombre,
    apellido,
    nombreCompleto,
    email: usuario.email,
    passwordEnmascarada: passwordReal,
    categoria,
    rolId,
    rol: rolCodigo,
    rolEtiqueta,
    habilitado: Boolean(usuario.activo),
    avatarColor: calcularAvatarColor(usuario.id, rolCodigo),
    iniciales: calcularIniciales(nombre, apellido),
    creadoEn: creadoEnIso,
    fechaRegistro,
  };
}

