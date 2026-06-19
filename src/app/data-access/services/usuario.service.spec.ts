import { TestBed } from '@angular/core/testing';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsuarioService]
    });
    service = TestBed.inject(UsuarioService);
  });

  describe('getUsuarioActual', () => {
    it('dado que se llama a getUsuarioActual, debería retornar el usuario mockeado', () => {
      const usuario = service.getUsuarioActual();
      expect(usuario.id).toBe('usuario-1');
      expect(usuario.nombre).toBe('Martín');
    });
  });

  describe('getAlumnoActual', () => {
    it('dado que se llama a getAlumnoActual, debería retornar el alumno mockeado', () => {
      const alumno = service.getAlumnoActual();
      expect(alumno.id).toBe('julian-garcia');
      expect(alumno.saldo).toBe(2580);
    });
  });

  describe('setHomeUrl y computados', () => {
    it('dado que se establece una homeUrl, las señales esVistaAlumno y esVistaKiosquero deberían actualizarse correctamente', () => {
      expect(service.homeUrl()).toBe('/tutor');
      expect(service.esVistaAlumno()).toBeFalse();
      expect(service.esVistaKiosquero()).toBeFalse();

      service.setHomeUrl('/alumno');
      expect(service.homeUrl()).toBe('/alumno');
      expect(service.esVistaAlumno()).toBeTrue();
      expect(service.esVistaKiosquero()).toBeFalse();

      service.setHomeUrl('/kiosquero');
      expect(service.homeUrl()).toBe('/kiosquero');
      expect(service.esVistaAlumno()).toBeFalse();
      expect(service.esVistaKiosquero()).toBeTrue();
    });
  });

  describe('setNombreNavbar', () => {
    it('dado que se establece un nombre de navbar, la señal nombreNavbar debería reflejarlo', () => {
      expect(service.nombreNavbar()).toBe('Martín');

      service.setNombreNavbar('Juan');
      expect(service.nombreNavbar()).toBe('Juan');
    });
  });
});
