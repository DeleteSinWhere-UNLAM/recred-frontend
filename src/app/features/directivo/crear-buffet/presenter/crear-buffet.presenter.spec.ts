import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CrearBuffetRequest } from '../../models/directivo.model';
import { DirectivoService } from '../../services/directivo.service';
import { CrearBuffetPresenter } from './crear-buffet.presenter';

class CrearBuffetRequestMother {
  static crear(override: Partial<CrearBuffetRequest> = {}): CrearBuffetRequest {
    return {
      name: 'Buffet Central',
      habilitationExpirationDate: '2027-12-31',
      ...override,
    } as CrearBuffetRequest;
  }
}

describe('CrearBuffetPresenter', () => {
  let presenter: CrearBuffetPresenter;
  let directivoService: jasmine.SpyObj<DirectivoService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    directivoService = jasmine.createSpyObj('DirectivoService', ['crearBuffet']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        CrearBuffetPresenter,
        { provide: DirectivoService, useValue: directivoService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(CrearBuffetPresenter);
  });

  describe('estado inicial', () => {
    it('dado el presenter recien creado, deberia estar sin loading y sin error', () => {
      expect(presenter.loading()).toBeFalse();
      expect(presenter.error()).toBeNull();
    });
  });

  describe('crear', () => {
    it('dado la creacion es exitosa, deberia navegar a /directivo y bajar loading', async () => {
      directivoService.crearBuffet.and.resolveTo({ buffetId: 'buffet-1' });

      await presenter.crear('school-1', CrearBuffetRequestMother.crear());

      expect(directivoService.crearBuffet).toHaveBeenCalledWith('school-1', CrearBuffetRequestMother.crear());
      expect(router.navigate).toHaveBeenCalledWith(['/directivo']);
      expect(presenter.loading()).toBeFalse();
      expect(presenter.error()).toBeNull();
    });

    it('dado HttpErrorResponse, deberia setear mensaje de error de registrar', async () => {
      directivoService.crearBuffet.and.rejectWith(new HttpErrorResponse({ status: 400 }));

      await presenter.crear('school-1', CrearBuffetRequestMother.crear());

      expect(presenter.error()).toBe('Ocurrió un error al registrar el buffet.');
      expect(presenter.loading()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('dado un error inesperado (no HttpErrorResponse), deberia setear "Error inesperado"', async () => {
      directivoService.crearBuffet.and.rejectWith(new Error('boom'));

      await presenter.crear('school-1', CrearBuffetRequestMother.crear());

      expect(presenter.error()).toBe('Error inesperado.');
      expect(presenter.loading()).toBeFalse();
    });

    it('cuando arranca la creacion, deberia setear loading en true antes de resolver', async () => {
      let resolver: (() => void) | null = null;
      directivoService.crearBuffet.and.returnValue(
        new Promise((res) => {
          resolver = () => res({ buffetId: 'x' } as never);
        }),
      );

      const promesa = presenter.crear('school-1', CrearBuffetRequestMother.crear());
      expect(presenter.loading()).toBeTrue();

      resolver!();
      await promesa;
      expect(presenter.loading()).toBeFalse();
    });

    it('cuando reintento despues de un error, deberia limpiar el error previo', async () => {
      directivoService.crearBuffet.and.rejectWith(new Error('boom'));
      await presenter.crear('school-1', CrearBuffetRequestMother.crear());
      expect(presenter.error()).toBe('Error inesperado.');

      directivoService.crearBuffet.and.resolveTo({ buffetId: 'x' });
      await presenter.crear('school-1', CrearBuffetRequestMother.crear());

      expect(presenter.error()).toBeNull();
    });
  });

  describe('cancelar', () => {
    it('deberia navegar al dashboard directivo', () => {
      presenter.cancelar();

      expect(router.navigate).toHaveBeenCalledWith(['/directivo']);
    });
  });
});
