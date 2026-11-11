import { describe, it, expect } from 'vitest';
import {
  calcularIniciales,
  calcularAvatarColor,
  mapPrismaUsuarioToAdminFila,
} from './admin-usuario.mapper.js';

describe('admin-usuario.mapper', () => {
  it('calcula iniciales limpiando prefijos académicos', () => {
    expect(calcularIniciales('Dr. Ricardo', 'Palma Benavides')).toBe('RP');
    expect(calcularIniciales('Lic. Patricia', 'Vega Zeballos')).toBe('PV');
    expect(calcularIniciales('Carlos', 'Mendoza Rivera')).toBe('CM');
  });

  it('asigna colores determinísticos por rol', () => {
    expect(calcularAvatarColor('usr_1', 'PRESIDENTE_CEI')).toBe('#5c2d91');
    expect(calcularAvatarColor('usr_2', 'VOCAL_CEI')).toBe('#107c10');
  });

  it('mapea entidad Prisma a AdminUsuarioFilaDto incluyendo password para visualización del administrador', () => {
    const dto = mapPrismaUsuarioToAdminFila(
      {
        id: 'usr_presidente_1',
        nombre: 'Dr. Ricardo',
        apellido: 'Palma Benavides',
        email: 'presidente.cei@estanciaperu.gob.pe',
        password: 'Estancia2026!#',
        activo: true,
        creadoEn: new Date('2026-10-22T15:31:41.819Z'),
        roles: [
          {
            rol: {
              id: 3,
              codigo: 'PRESIDENTE_CEI',
              nombre: 'Presidente del CEI',
            },
          },
        ],
      },
      'EVALUADOR',
    );

    expect(dto).toEqual({
      id: 'usr_presidente_1',
      nombre: 'Dr. Ricardo',
      apellido: 'Palma Benavides',
      nombreCompleto: 'Dr. Ricardo Palma Benavides',
      email: 'presidente.cei@estanciaperu.gob.pe',
      passwordEnmascarada: 'Estancia2026!#',
      categoria: 'EVALUADOR',
      rolId: 3,
      rol: 'PRESIDENTE_CEI',
      rolEtiqueta: 'Presidente del CEI',
      habilitado: true,
      avatarColor: '#5c2d91',
      iniciales: 'RP',
      creadoEn: '2026-10-22T15:31:41.819Z',
      fechaRegistro: '2026-10-22',
    });
  });
});

