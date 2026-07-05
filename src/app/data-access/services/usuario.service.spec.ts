import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  function crearService(): UsuarioService {
    TestBed.configureTestingModule({
      providers: [
        UsuarioService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    return TestBed.inject(UsuarioService);
  }

  describe('homeUrl inicial', () => {
    it('dado sin storage previo, deberia arrancar en /tutor', () => {
      const service = crearService();

      expect(service.homeUrl()).toBe('/tutor');
    });

    it('dado un savedHome en localStorage, deberia respetarlo', () => {
      localStorage.setItem('recreopago_homeUrl', '/alumno');

      const service = crearService();

      expect(service.homeUrl()).toBe('/alumno');
      expect(service.esVistaAlumno()).toBeTrue();
    });

    it('dado un perfil ALUMNO en localStorage, deberia derivar /alumno', () => {
      localStorage.setItem('recred.perfil', JSON.stringify({ rol: 'ALUMNO' }));

      const service = crearService();

      expect(service.homeUrl()).toBe('/alumno');
    });

    it('dado un perfil VENDEDOR en localStorage, deberia derivar /kiosquero', () => {
      localStorage.setItem('recred.perfil', JSON.stringify({ rol: 'VENDEDOR' }));

      const service = crearService();

      expect(service.homeUrl()).toBe('/kiosquero');
      expect(service.esVistaKiosquero()).toBeTrue();
    });

    it('dado un perfil PADRE en localStorage, deberia derivar /tutor', () => {
      localStorage.setItem('recred.perfil', JSON.stringify({ rol: 'PADRE' }));

      const service = crearService();

      expect(service.homeUrl()).toBe('/tutor');
    });

    it('dado un perfil corrupto en localStorage, deberia caer al default /tutor', () => {
      localStorage.setItem('recred.perfil', '{corrupto');

      const service = crearService();

      expect(service.homeUrl()).toBe('/tutor');
    });
  });

  describe('nombreNavbar', () => {
    it('dado sin storage previo, deberia usar el nombre del usuario actual', () => {
      const service = crearService();

      expect(service.nombreNavbar()).toBe('Martín');
    });

    it('dado un savedNombreNavbar en storage, deberia respetarlo', () => {
      localStorage.setItem('recreopago_nombreNavbar', 'Rocio');

      const service = crearService();

      expect(service.nombreNavbar()).toBe('Rocio');
    });
  });

  describe('setters y getters', () => {
    it('dado setHomeUrl, deberia actualizar el signal y persistir en localStorage', () => {
      const service = crearService();

      service.setHomeUrl('/kiosquero');

      expect(service.homeUrl()).toBe('/kiosquero');
      expect(localStorage.getItem('recreopago_homeUrl')).toBe('/kiosquero');
    });

    it('dado setNombreNavbar, deberia actualizar el signal y persistir', () => {
      const service = crearService();

      service.setNombreNavbar('Ana');

      expect(service.nombreNavbar()).toBe('Ana');
      expect(localStorage.getItem('recreopago_nombreNavbar')).toBe('Ana');
    });

    it('getUsuarioActual deberia devolver el usuario mock', () => {
      const service = crearService();

      expect(service.getUsuarioActual().id).toBe('usuario-1');
    });

    it('getAlumnoActual deberia devolver el alumno mock', () => {
      const service = crearService();

      expect(service.getAlumnoActual().id).toBe('julian-garcia');
    });
  });
});
