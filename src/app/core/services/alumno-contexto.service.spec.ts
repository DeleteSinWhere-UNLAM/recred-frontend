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
    it('dado sessionStorage vacio, cuando leo alumnoId, deberia ser string vacio', () => {
      thenElAlumnoIdEs(service, '');
    });

    it('dado un id ya guardado en sessionStorage, cuando instancio, deberia rehidratarlo', () => {
      givenAlumnoIdEnSessionStorage('alumno-pre-existente');

      const nuevoService = whenReInstancioElService();

      thenElAlumnoIdEs(nuevoService, 'alumno-pre-existente');
    });
  });

  describe('setAlumnoId', () => {
    it('dado un id, cuando lo seteo, deberia actualizar el signal y persistir en sessionStorage', () => {
      whenSeteoElAlumnoId('alumno-1');

      thenElAlumnoIdEs(service, 'alumno-1');
      thenElSessionStorageContiene('alumno-1');
    });

    it('dado dos setAlumnoId consecutivos, cuando leo, deberia quedar con el ultimo', () => {
      whenSeteoElAlumnoId('alumno-1');
      whenSeteoElAlumnoId('alumno-2');

      thenElAlumnoIdEs(service, 'alumno-2');
      thenElSessionStorageContiene('alumno-2');
    });
  });

  describe('limpiar', () => {
    it('dado un id seteado, cuando llamo limpiar, deberia dejarlo vacio y sacarlo del sessionStorage', () => {
      whenSeteoElAlumnoId('alumno-1');

      service.limpiar();

      thenElAlumnoIdEs(service, '');
      expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  function givenAlumnoIdEnSessionStorage(id: string): void {
    sessionStorage.setItem(SESSION_KEY, id);
  }

  function whenReInstancioElService(): AlumnoContextoService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [AlumnoContextoService] });
    return TestBed.inject(AlumnoContextoService);
  }

  function whenSeteoElAlumnoId(id: string): void {
    service.setAlumnoId(id);
  }

  function thenElAlumnoIdEs(instance: AlumnoContextoService, esperado: string): void {
    expect(instance.alumnoId()).toBe(esperado);
  }

  function thenElSessionStorageContiene(id: string): void {
    expect(sessionStorage.getItem(SESSION_KEY)).toBe(id);
  }
});
