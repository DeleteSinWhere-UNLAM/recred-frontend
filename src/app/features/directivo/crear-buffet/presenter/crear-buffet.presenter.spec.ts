import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CrearBuffetRequest, CrearBuffetResponse } from '../../models/directivo.model';
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

class CrearBuffetResponseMother {
  static crear(override: Partial<CrearBuffetResponse> = {}): CrearBuffetResponse {
    return {
      buffetId: 'buffet-1',
      ...override,
    } as CrearBuffetResponse;
  }
}

describe('CrearBuffetPresenter', () => {
  const SCHOOL_ID = 'school-1';

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
      thenLoadingEs(false);
      thenErrorEs(null);
    });
  });

  describe('crear', () => {
    it('dado que la creacion es exitosa, cuando creo, deberia navegar a /directivo y bajar loading', async () => {
      givenLaCreacionEsExitosa();

      await whenCreo(SCHOOL_ID, CrearBuffetRequestMother.crear());

      thenSeLlamoCrearBuffetCon(SCHOOL_ID, CrearBuffetRequestMother.crear());
      thenSeNavegoA(['/directivo']);
      thenLoadingEs(false);
      thenErrorEs(null);
    });

    it('dado un HttpErrorResponse, cuando creo, deberia mostrar mensaje de error de registrar', async () => {
      givenLaCreacionFallaCon(new HttpErrorResponse({ status: 400 }));

      await whenCreo(SCHOOL_ID, CrearBuffetRequestMother.crear());

      thenErrorEs('Ocurrió un error al registrar el buffet.');
      thenLoadingEs(false);
      thenNoSeNavego();
    });

    it('dado un error inesperado (no HttpErrorResponse), cuando creo, deberia mostrar "Error inesperado"', async () => {
      givenLaCreacionFallaCon(new Error('boom'));

      await whenCreo(SCHOOL_ID, CrearBuffetRequestMother.crear());

      thenErrorEs('Error inesperado.');
      thenLoadingEs(false);
    });

    it('cuando arranca la creacion, deberia setear loading en true antes de resolver', async () => {
      const [pendiente, resolver] = givenLaCreacionQuedaPendiente();

      const promesa = whenCreo(SCHOOL_ID, CrearBuffetRequestMother.crear());
      thenLoadingEs(true);

      resolver(CrearBuffetResponseMother.crear());
      await pendiente;
      await promesa;
      thenLoadingEs(false);
    });

    it('dado un error previo, cuando reintento crear exitosamente, deberia limpiar el error', async () => {
      givenLaCreacionFallaCon(new Error('boom'));
      await whenCreo(SCHOOL_ID, CrearBuffetRequestMother.crear());
      thenErrorEs('Error inesperado.');
      givenLaCreacionEsExitosa();

      await whenCreo(SCHOOL_ID, CrearBuffetRequestMother.crear());

      thenErrorEs(null);
    });
  });

  describe('cancelar', () => {
    it('cuando cancelo, deberia navegar al dashboard directivo', () => {
      whenCancelo();

      thenSeNavegoA(['/directivo']);
    });
  });

  function givenLaCreacionEsExitosa(): void {
    directivoService.crearBuffet.and.resolveTo(CrearBuffetResponseMother.crear());
  }

  function givenLaCreacionFallaCon(err: unknown): void {
    directivoService.crearBuffet.and.rejectWith(err);
  }

  function givenLaCreacionQuedaPendiente(): [
    Promise<CrearBuffetResponse>,
    (v: CrearBuffetResponse) => void,
  ] {
    let resolver!: (v: CrearBuffetResponse) => void;
    const pendiente = new Promise<CrearBuffetResponse>((resolve) => {
      resolver = resolve;
    });
    directivoService.crearBuffet.and.returnValue(pendiente);
    return [pendiente, resolver];
  }

  function whenCreo(schoolId: string, payload: CrearBuffetRequest): Promise<void> {
    return presenter.crear(schoolId, payload);
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

  function thenSeLlamoCrearBuffetCon(schoolId: string, payload: CrearBuffetRequest): void {
    expect(directivoService.crearBuffet).toHaveBeenCalledWith(schoolId, payload);
  }

  function thenSeNavegoA(ruta: string[]): void {
    expect(router.navigate).toHaveBeenCalledWith(ruta);
  }

  function thenNoSeNavego(): void {
    expect(router.navigate).not.toHaveBeenCalled();
  }
});
