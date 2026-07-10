import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CrearVendedorRequest } from '../../models/directivo.model';
import { DirectivoService } from '../../services/directivo.service';
import { AsignarVendedorPresenter } from './asignar-vendedor.presenter';
import { ToastService } from '../../../../shared/services/toast.service';

class CrearVendedorRequestMother {
  static crear(override: Partial<CrearVendedorRequest> = {}): CrearVendedorRequest {
    return {
      username: 'carlosperez',
      email: 'carlos@example.com',
      firstName: 'Carlos',
      lastName: 'Perez',
      dni: '20000000',
      phone: '011-1111',
      cuit: '20200000005',
      ...override,
    };
  }
}

describe('AsignarVendedorPresenter', () => {
  let presenter: AsignarVendedorPresenter;
  let directivoService: jasmine.SpyObj<DirectivoService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    directivoService = jasmine.createSpyObj('DirectivoService', ['registrarVendedor']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AsignarVendedorPresenter,
        { provide: DirectivoService, useValue: directivoService },
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['mostrar']) }
      ],
    });

    presenter = TestBed.inject(AsignarVendedorPresenter);
  });

  describe('estado inicial', () => {
    it('dado el presenter recien creado, deberia estar sin loading y sin error', () => {
      expect(presenter.loading()).toBeFalse();
      expect(presenter.error()).toBeNull();
    });
  });

  describe('asignar', () => {
    it('dado que el registro es exitoso, deberia navegar a /directivo y bajar loading', async () => {
      directivoService.registrarVendedor.and.resolveTo({ kiosqueroId: 'k1', usuarioId: 'u1' });

      await presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());

      expect(directivoService.registrarVendedor).toHaveBeenCalledWith('buffet-1', CrearVendedorRequestMother.crear());
      expect(router.navigate).toHaveBeenCalledWith(['/directivo']);
      expect(presenter.loading()).toBeFalse();
      expect(presenter.error()).toBeNull();
    });

    it('dado HttpErrorResponse 409 con code USERNAME_EXISTS, deberia setear mensaje de usuario ya registrado', async () => {
      directivoService.registrarVendedor.and.rejectWith(
        new HttpErrorResponse({ status: 409, error: { code: 'USERNAME_EXISTS' } }),
      );

      await presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());

      expect(presenter.error()).toBe('Error: El correo electrónico ya está registrado o es inválido. Por favor, intenta de nuevo.');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('dado HttpErrorResponse 409 sin code, deberia setear mensaje generico de asignar', async () => {
      directivoService.registrarVendedor.and.rejectWith(new HttpErrorResponse({ status: 409 }));

      await presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());

      expect(presenter.error()).toBe('Ocurrió un error al asignar el vendedor.');
    });

    it('dado HttpErrorResponse con otro status, deberia setear mensaje generico', async () => {
      directivoService.registrarVendedor.and.rejectWith(new HttpErrorResponse({ status: 500 }));

      await presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());

      expect(presenter.error()).toBe('Ocurrió un error al asignar el vendedor.');
    });

    it('dado un error inesperado (no HttpErrorResponse), deberia setear "Error inesperado"', async () => {
      directivoService.registrarVendedor.and.rejectWith(new Error('boom'));

      await presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());

      expect(presenter.error()).toBe('Error inesperado.');
      expect(presenter.loading()).toBeFalse();
    });

    it('cuando arranca la asignacion, deberia setear loading en true antes de resolver', async () => {
      let resolver: (() => void) | null = null;
      directivoService.registrarVendedor.and.returnValue(
        new Promise((res) => {
          resolver = () => res({ kiosqueroId: 'k', usuarioId: 'u' } as never);
        }),
      );

      const promesa = presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());
      expect(presenter.loading()).toBeTrue();

      resolver!();
      await promesa;
      expect(presenter.loading()).toBeFalse();
    });

    it('cuando reintento despues de un error, deberia limpiar el error previo', async () => {
      directivoService.registrarVendedor.and.rejectWith(new Error('boom'));
      await presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());
      expect(presenter.error()).toBe('Error inesperado.');

      directivoService.registrarVendedor.and.resolveTo({ kiosqueroId: 'k', usuarioId: 'u' });
      await presenter.asignar('buffet-1', CrearVendedorRequestMother.crear());

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
