import { TestBed } from '@angular/core/testing';
import { AlumnoContextoService } from './alumno-contexto.service';

const SESSION_KEY = 'recred_alumno_id';

describe('AlumnoContextoService', () => {
  let service: AlumnoContextoService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [AlumnoContextoService] });
    service = TestBed.inject(AlumnoContextoService);
  });

  afterEach(() => sessionStorage.clear());

  describe('estado inicial', () => {
    it('dado sessionStorage vacio, alumnoId deberia ser string vacio', () => {
      expect(service.alumnoId()).toBe('');
    });

    it('dado un id en sessionStorage al instanciar, deberia rehidratarlo', () => {
      sessionStorage.setItem(SESSION_KEY, 'alumno-pre-existente');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [AlumnoContextoService] });

      const nuevoService = TestBed.inject(AlumnoContextoService);

      expect(nuevoService.alumnoId()).toBe('alumno-pre-existente');
    });
  });

  describe('setAlumnoId', () => {
    it('dado un id, cuando lo seteo, deberia actualizar el signal y persistir en sessionStorage', () => {
      service.setAlumnoId('alumno-1');

      expect(service.alumnoId()).toBe('alumno-1');
      expect(sessionStorage.getItem(SESSION_KEY)).toBe('alumno-1');
    });

    it('dado dos setAlumnoId consecutivos, deberia quedar con el ultimo', () => {
      service.setAlumnoId('alumno-1');
      service.setAlumnoId('alumno-2');

      expect(service.alumnoId()).toBe('alumno-2');
      expect(sessionStorage.getItem(SESSION_KEY)).toBe('alumno-2');
    });
  });

  describe('limpiar', () => {
    it('dado un id seteado, cuando llamo limpiar, deberia dejarlo vacio y sacarlo del sessionStorage', () => {
      service.setAlumnoId('alumno-1');

      service.limpiar();

      expect(service.alumnoId()).toBe('');
      expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });
});
