import { describe, it, expect, beforeEach } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import { UserTokenService } from './user-token.service.js';

describe('UserTokenService', () => {
  let service: UserTokenService;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({ secret: 'test-secret' });
    service = new UserTokenService(jwtService);
  });

  describe('determineHomeView', () => {
    it('debe asignar "inicio" (Vista 1) exclusivamente cuando el rol es SOLICITANTE', () => {
      const view = service.determineHomeView(['SOLICITANTE']);
      expect(view).toBe('inicio');
    });

    it('debe asignar "homeview2" (Vista 2) para PRESIDENTE_CEI', () => {
      const view = service.determineHomeView(['PRESIDENTE_CEI']);
      expect(view).toBe('homeview2');
    });

    it('debe asignar "homeview2" (Vista 2) para VOCAL_CEI', () => {
      const view = service.determineHomeView(['VOCAL_CEI']);
      expect(view).toBe('homeview2');
    });

    it('debe asignar "homeview2" (Vista 2) para SECRETARIA_TECNICA_CEI', () => {
      const view = service.determineHomeView(['SECRETARIA_TECNICA_CEI']);
      expect(view).toBe('homeview2');
    });

    it('debe asignar "homeview2" (Vista 2) para EVALUADOR', () => {
      const view = service.determineHomeView(['EVALUADOR']);
      expect(view).toBe('homeview2');
    });

    it('debe asignar "homeview2" (Vista 2) para ADMINISTRADOR', () => {
      const view = service.determineHomeView(['ADMINISTRADOR']);
      expect(view).toBe('homeview2');
    });

    it('debe asignar "homeview2" si un usuario tiene rol mixto (SOLICITANTE + VOCAL_CEI)', () => {
      const view = service.determineHomeView(['SOLICITANTE', 'VOCAL_CEI']);
      expect(view).toBe('homeview2');
    });
  });

  describe('generateToken', () => {
    it('debe generar un token JWT que contenga homeView = "inicio" para un solicitante', async () => {
      const result = await service.generateToken({
        id: 'user-1',
        email: 'solicitante@estanciaperu.gob.pe',
        nombre: 'Dr. Carlos Mendoza',
        roles: ['SOLICITANTE'],
      });

      expect(result.homeView).toBe('inicio');
      expect(result.accessToken).toBeDefined();

      const decoded = await service.verifyToken(result.accessToken);
      expect(decoded.homeView).toBe('inicio');
      expect(decoded.roles).toEqual(['SOLICITANTE']);
    });

    it('debe generar un token JWT que contenga homeView = "homeview2" para el Presidente del CEI', async () => {
      const result = await service.generateToken({
        id: 'user-2',
        email: 'presidente.cei@estanciaperu.gob.pe',
        nombre: 'Dr. Ricardo Palma',
        roles: ['PRESIDENTE_CEI'],
      });

      expect(result.homeView).toBe('homeview2');
      expect(result.accessToken).toBeDefined();

      const decoded = await service.verifyToken(result.accessToken);
      expect(decoded.homeView).toBe('homeview2');
      expect(decoded.roles).toEqual(['PRESIDENTE_CEI']);
    });
  });
});
