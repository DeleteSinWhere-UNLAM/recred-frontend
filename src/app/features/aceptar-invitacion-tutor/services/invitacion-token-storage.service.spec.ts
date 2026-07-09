import { TestBed } from '@angular/core/testing';
import { InvitacionTokenStorageService } from './invitacion-token-storage.service';

const STORAGE_KEY = 'invitacionTutorToken';

describe('InvitacionTokenStorageService', () => {
  let service: InvitacionTokenStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvitacionTokenStorageService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('guardar', () => {
    it('dado un token, cuando lo guardo, deberia persistirlo en localStorage bajo la clave esperada', () => {
      whenGuardo('token-123');

      expect(localStorage.getItem(STORAGE_KEY)).toBe('token-123');
    });

    it('dado un token existente, cuando guardo otro, deberia sobreescribir el anterior', () => {
      whenGuardo('token-viejo');
      whenGuardo('token-nuevo');

      expect(localStorage.getItem(STORAGE_KEY)).toBe('token-nuevo');
    });
  });

  describe('leer', () => {
    it('dado que no hay nada guardado, cuando leo, deberia devolver null', () => {
      expect(service.leer()).toBeNull();
    });

    it('dado un token guardado, cuando leo, deberia devolverlo', () => {
      whenGuardo('token-persistido');

      expect(service.leer()).toBe('token-persistido');
    });
  });

  describe('limpiar', () => {
    it('dado un token guardado, cuando limpio, deberia borrarlo de localStorage', () => {
      whenGuardo('token-a-borrar');

      service.limpiar();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(service.leer()).toBeNull();
    });

    it('dado que no hay nada guardado, cuando limpio, no deberia romper', () => {
      expect(() => service.limpiar()).not.toThrow();
      expect(service.leer()).toBeNull();
    });
  });

  function whenGuardo(token: string): void {
    service.guardar(token);
  }
});
