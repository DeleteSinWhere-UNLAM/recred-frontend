import { TestBed } from '@angular/core/testing';
import { UsuarioService } from './usuario.service';

const KEY_HOME = 'recreopago_homeUrl';
const KEY_NAV = 'recreopago_nombreNavbar';
const KEY_PERFIL = 'recred.perfil';

describe('UsuarioService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.clear());

  describe('homeUrl inicial', () => {
    it('dado sin storage previo, cuando instancio, homeUrl deberia arrancar en /tutor', () => {
      const service = whenInstancio();

      expect(service.homeUrl()).toBe('/tutor');
    });

    it('dado un savedHome en localStorage, cuando instancio, deberia respetarlo', () => {
      givenSavedHome('/alumno');

      const service = whenInstancio();

      expect(service.homeUrl()).toBe('/alumno');
      expect(service.esVistaAlumno()).toBeTrue();
    });

    it('dado un perfil ALUMNO en localStorage, cuando instancio, deberia derivar /alumno', () => {
      givenPerfilEnStorage({ rol: 'ALUMNO' });

      const service = whenInstancio();

      expect(service.homeUrl()).toBe('/alumno');
    });

    it('dado un perfil VENDEDOR en localStorage, cuando instancio, deberia derivar /kiosquero', () => {
      givenPerfilEnStorage({ rol: 'VENDEDOR' });

      const service = whenInstancio();

      expect(service.homeUrl()).toBe('/kiosquero');
      expect(service.esVistaKiosquero()).toBeTrue();
    });

    it('dado un perfil PADRE en localStorage, cuando instancio, deberia derivar /tutor', () => {
      givenPerfilEnStorage({ rol: 'PADRE' });

      const service = whenInstancio();

      expect(service.homeUrl()).toBe('/tutor');
    });

    it('dado un perfil corrupto en localStorage, cuando instancio, deberia caer al default /tutor', () => {
      localStorage.setItem(KEY_PERFIL, '{corrupto');

      const service = whenInstancio();

      expect(service.homeUrl()).toBe('/tutor');
    });
  });

  describe('nombreNavbar', () => {
    it('dado sin storage previo, cuando instancio, deberia usar el nombre del usuario actual', () => {
      const service = whenInstancio();

      expect(service.nombreNavbar()).toBe('Martín');
    });

    it('dado un savedNombreNavbar en storage, cuando instancio, deberia respetarlo', () => {
      givenSavedNombreNavbar('Rocio');

      const service = whenInstancio();

      expect(service.nombreNavbar()).toBe('Rocio');
    });
  });

  describe('setters y getters', () => {
    it('dado el service, cuando llamo setHomeUrl, deberia actualizar el signal y persistir en localStorage', () => {
      const service = whenInstancio();

      service.setHomeUrl('/kiosquero');

      expect(service.homeUrl()).toBe('/kiosquero');
      expect(localStorage.getItem(KEY_HOME)).toBe('/kiosquero');
    });

    it('dado el service, cuando llamo setNombreNavbar, deberia actualizar el signal y persistir', () => {
      const service = whenInstancio();

      service.setNombreNavbar('Ana');

      expect(service.nombreNavbar()).toBe('Ana');
      expect(localStorage.getItem(KEY_NAV)).toBe('Ana');
    });

    it('dado el service, cuando pido el usuario actual, deberia devolver el usuario mock', () => {
      const service = whenInstancio();

      expect(service.getUsuarioActual().id).toBe('usuario-1');
    });

    it('dado el service, cuando pido el alumno actual, deberia devolver el alumno mock', () => {
      const service = whenInstancio();

      expect(service.getAlumnoActual().id).toBe('julian-garcia');
    });
  });

  function givenSavedHome(url: string): void {
    localStorage.setItem(KEY_HOME, url);
  }

  function givenSavedNombreNavbar(nombre: string): void {
    localStorage.setItem(KEY_NAV, nombre);
  }

  function givenPerfilEnStorage(perfil: { rol: 'ALUMNO' | 'VENDEDOR' | 'PADRE' }): void {
    localStorage.setItem(KEY_PERFIL, JSON.stringify(perfil));
  }

  function whenInstancio(): UsuarioService {
    TestBed.configureTestingModule({ providers: [UsuarioService] });
    return TestBed.inject(UsuarioService);
  }
});
