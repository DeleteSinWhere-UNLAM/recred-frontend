import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CrearVendedorRequest, CrearVendedorResponse } from '../../models/directivo.model';
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

class CrearVendedorResponseMother {
  static crear(override: Partial<CrearVendedorResponse> = {}): CrearVendedorResponse {
    return {
      kiosqueroId: 'k1',
      usuarioId: 'u1',
      ...override,
    };
  }
}

describe('AsignarVendedorPresenter', () => {
  const BUFFET_ID = 'buffet-1';

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
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['mostrar']) },
      ],
    });

    presenter = TestBed.inject(AsignarVendedorPresenter);
  });

  describe('estado inicial', () => {
    it('dado el presenter recien creado, deberia estar sin loading y sin error', () => {
      thenLoadingEs(false);
      thenErrorEs(null);
    });
  });

  describe('asignar', () => {
    it('dado que el registro es exitoso, cuando asigno, deberia navegar a /directivo y bajar loading', async () => {
      givenElRegistroEsExitoso();

      await whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());

      thenSeLlamoRegistrarVendedorCon(BUFFET_ID, CrearVendedorRequestMother.crear());
      thenSeNavegoA(['/directivo']);
      thenLoadingEs(false);
      thenErrorEs(null);
    });

    it('dado un 409 con code USERNAME_EXISTS, cuando asigno, deberia mostrar mensaje de correo ya registrado', async () => {
      givenElRegistroFallaCon(new HttpErrorResponse({ status: 409, error: { code: 'USERNAME_EXISTS' } }));

      await whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());

      thenErrorEs(
        'Error: El correo electrónico ya está registrado o es inválido. Por favor, intenta de nuevo.',
      );
      thenNoSeNavego();
    });

    it('dado un 409 sin code, cuando asigno, deberia mostrar mensaje generico de asignar', async () => {
      givenElRegistroFallaCon(new HttpErrorResponse({ status: 409 }));

      await whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());

      thenErrorEs('Ocurrió un error al asignar el vendedor.');
    });

    it('dado un HttpErrorResponse con otro status, cuando asigno, deberia mostrar mensaje generico', async () => {
      givenElRegistroFallaCon(new HttpErrorResponse({ status: 500 }));

      await whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());

      thenErrorEs('Ocurrió un error al asignar el vendedor.');
    });

    it('dado un error inesperado (no HttpErrorResponse), cuando asigno, deberia mostrar "Error inesperado"', async () => {
      givenElRegistroFallaCon(new Error('boom'));

      await whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());

      thenErrorEs('Error inesperado.');
      thenLoadingEs(false);
    });

    it('cuando arranca la asignacion, deberia setear loading en true antes de resolver', async () => {
      const [pendiente, resolver] = givenElRegistroQuedaPendiente();

      const promesa = whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());
      thenLoadingEs(true);

      resolver(CrearVendedorResponseMother.crear());
      await pendiente;
      await promesa;
      thenLoadingEs(false);
    });

    it('dado un error previo, cuando reintento asignar exitosamente, deberia limpiar el error', async () => {
      givenElRegistroFallaCon(new Error('boom'));
      await whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());
      thenErrorEs('Error inesperado.');
      givenElRegistroEsExitoso();

      await whenAsigno(BUFFET_ID, CrearVendedorRequestMother.crear());

      thenErrorEs(null);
    });
  });

  describe('cancelar', () => {
    it('cuando cancelo, deberia navegar al dashboard directivo', () => {
      whenCancelo();

      thenSeNavegoA(['/directivo']);
    });
  });

  function givenElRegistroEsExitoso(): void {
    directivoService.registrarVendedor.and.resolveTo(CrearVendedorResponseMother.crear());
  }

  function givenElRegistroFallaCon(err: unknown): void {
    directivoService.registrarVendedor.and.rejectWith(err);
  }

  function givenElRegistroQuedaPendiente(): [
    Promise<CrearVendedorResponse>,
    (v: CrearVendedorResponse) => void,
  ] {
    let resolver!: (v: CrearVendedorResponse) => void;
    const pendiente = new Promise<CrearVendedorResponse>((resolve) => {
      resolver = resolve;
    });
    directivoService.registrarVendedor.and.returnValue(pendiente);
    return [pendiente, resolver];
  }

  function whenAsigno(buffetId: string, payload: CrearVendedorRequest): Promise<void> {
    return presenter.asignar(buffetId, payload);
  }

  function whenCancelo(): void {
    presenter.cancelar();
  }

  function thenLoadingEs(esperado: boolean): void {
    expect(presenter.loading()).toBe(esperado);
  }

  function thenErrorEs(esperado: string | null): void {
    expect(presenter.error()).toBe(esperado);
  }

  function thenSeLlamoRegistrarVendedorCon(buffetId: string, payload: CrearVendedorRequest): void {
    expect(directivoService.registrarVendedor).toHaveBeenCalledWith(buffetId, payload);
  }

  function thenSeNavegoA(ruta: string[]): void {
    expect(router.navigate).toHaveBeenCalledWith(ruta);
  }

  function thenNoSeNavego(): void {
    expect(router.navigate).not.toHaveBeenCalled();
  }
});
