import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Alumno } from '../../../data-access/models/alumno.model';
import { CrearHijoRequest } from '../../../data-access/services/alumnos.service';
import { CrearHijoPresenter } from './crear-hijo.presenter';
import {
  AlumnoNuevoMother,
  ColegioMother,
  CrearHijoFormMother,
  GradoMother,
} from '../crear-hijo.mother';

describe('CrearHijoPresenter', () => {
  let presenter: CrearHijoPresenter;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    servicioAlumnos = jasmine.createSpyObj<AlumnosService>('AlumnosService', ['crearHijo']);
    servicioColegios = jasmine.createSpyObj<ColegiosService>('ColegiosService', [
      'obtenerColegios',
      'obtenerGradosPorColegio',
    ]);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        CrearHijoPresenter,
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(CrearHijoPresenter);
  });

  it('dado el presenter recien creado, deberia tener los signals en sus valores iniciales', () => {
    expect(presenter).toBeTruthy();
    expect(presenter.colegios()).toEqual([]);
    expect(presenter.grados()).toEqual([]);
    expect(presenter.guardando()).toBeFalse();
    expect(presenter.error()).toBeNull();
  });

  describe('cargarColegios', () => {
    it('dado que el back devuelve una lista, cuando cargo colegios, deberia exponerlos en el signal', async () => {
      const colegios = ColegioMother.crearLista();
      givenColegiosDelBack(colegios);

      await whenCargoColegios();

      thenSeLlamoObtenerColegiosVecesIgualA(1);
      expect(presenter.colegios()).toEqual(colegios);
      expect(presenter.cargandoColegios()).toBeFalse();
    });

    it('dado que ya hay colegios cargados, cuando vuelvo a cargar, no deberia volver a pegarle al back', async () => {
      givenColegiosDelBack(ColegioMother.crearLista());
      await whenCargoColegios();

      await whenCargoColegios();

      thenSeLlamoObtenerColegiosVecesIgualA(1);
    });

    it('dado que el back de colegios falla, cuando cargo colegios, deberia mostrar un toast de error', async () => {
      givenQueElBackDeColegiosFalla();

      await whenCargoColegios();

      expect(presenter.colegios()).toEqual([]);
      expect(presenter.cargandoColegios()).toBeFalse();
      thenSeMostroToast('No se pudieron cargar los colegios.', 'error');
    });
  });

  describe('cargarGrados', () => {
    it('dado un colegioId valido, cuando cargo grados, deberia traer los grados del back', async () => {
      const grados = GradoMother.crearLista();
      givenGradosDelBack(grados);

      await whenCargoGrados('colegio-1');

      expect(servicioColegios.obtenerGradosPorColegio).toHaveBeenCalledWith('colegio-1');
      expect(presenter.grados()).toEqual(grados);
      expect(presenter.cargandoGrados()).toBeFalse();
    });

    it('dado un colegioId vacio, cuando cargo grados, deberia resetear los grados sin pegarle al back', async () => {
      givenGradosDelBack(GradoMother.crearLista());
      await whenCargoGrados('colegio-1');

      await whenCargoGrados('');

      expect(presenter.grados()).toEqual([]);
      expect(servicioColegios.obtenerGradosPorColegio).toHaveBeenCalledTimes(1);
    });

    it('dado que el back de grados falla, cuando cargo grados, deberia mostrar un toast de error', async () => {
      givenQueElBackDeGradosFalla();

      await whenCargoGrados('colegio-1');

      expect(presenter.grados()).toEqual([]);
      expect(presenter.cargandoGrados()).toBeFalse();
      thenSeMostroToast('No se pudieron cargar los grados.', 'error');
    });
  });

  describe('crear', () => {
    it('dado un form valido, cuando creo el hijo, deberia mostrar toast de exito y navegar a /tutor', async () => {
      const req = CrearHijoFormMother.crear();
      givenAlumnosCrearHijoResuelve(AlumnoNuevoMother.crear());

      const ok = await whenCreo(req);

      expect(ok).toBeTrue();
      expect(servicioAlumnos.crearHijo).toHaveBeenCalledWith(req);
      thenSeMostroToast('Juan Pérez fue agregado como hijo', 'success');
      thenSeNavegoA('/tutor');
      expect(presenter.guardando()).toBeFalse();
      expect(presenter.error()).toBeNull();
    });

    it('dado que ya hay una creacion en curso, cuando disparo otra, no deberia ejecutar la segunda', async () => {
      const [promesaPendiente, resolver] = givenCreacionPendiente();

      const primera = whenCreo(CrearHijoFormMother.crear());
      const segunda = whenCreo(CrearHijoFormMother.crear());
      const resultadoSegunda = await segunda;
      resolver(AlumnoNuevoMother.crear());
      await primera;
      await promesaPendiente;

      expect(resultadoSegunda).toBeFalse();
      expect(servicioAlumnos.crearHijo).toHaveBeenCalledTimes(1);
    });

    it('dado un error 409 con mensaje del back, cuando creo el hijo, deberia exponer ese mensaje', async () => {
      givenCrearHijoRechazaCon409ConMensaje('El DNI ya existe');

      const ok = await whenCreo(CrearHijoFormMother.crear());

      expect(ok).toBeFalse();
      expect(presenter.error()).toBe('El DNI ya existe');
      thenSeMostroToast('El DNI ya existe', 'error');
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('dado un error 409 sin body, cuando creo el hijo, deberia usar el mensaje por defecto', async () => {
      givenCrearHijoRechazaCon409SinBody();

      await whenCreo(CrearHijoFormMother.crear());

      expect(presenter.error()).toBe('Ya existe un alumno con esos datos.');
    });

    it('dado un error que no es HTTP, cuando creo el hijo, deberia usar el mensaje generico', async () => {
      givenCrearHijoRechazaConErrorGenerico();

      await whenCreo(CrearHijoFormMother.crear());

      expect(presenter.error()).toBe('No se pudo crear el hijo. Intenta nuevamente.');
    });
  });

  function givenColegiosDelBack(colegios: ReturnType<typeof ColegioMother.crearLista>): void {
    servicioColegios.obtenerColegios.and.resolveTo(colegios);
  }

  function givenGradosDelBack(grados: ReturnType<typeof GradoMother.crearLista>): void {
    servicioColegios.obtenerGradosPorColegio.and.resolveTo(grados);
  }

  function givenQueElBackDeColegiosFalla(): void {
    servicioColegios.obtenerColegios.and.rejectWith(new HttpErrorResponse({ status: 500 }));
  }

  function givenQueElBackDeGradosFalla(): void {
    servicioColegios.obtenerGradosPorColegio.and.rejectWith(new HttpErrorResponse({ status: 500 }));
  }

  function givenAlumnosCrearHijoResuelve(alumno: Alumno): void {
    servicioAlumnos.crearHijo.and.resolveTo(alumno);
  }

  function givenCreacionPendiente(): [Promise<Alumno>, (a: Alumno) => void] {
    let resolver!: (a: Alumno) => void;
    const promesa = new Promise<Alumno>((resolve) => {
      resolver = resolve;
    });
    servicioAlumnos.crearHijo.and.returnValue(promesa);
    return [promesa, resolver];
  }

  function givenCrearHijoRechazaCon409ConMensaje(mensaje: string): void {
    servicioAlumnos.crearHijo.and.rejectWith(
      new HttpErrorResponse({ status: 409, error: { message: mensaje } }),
    );
  }

  function givenCrearHijoRechazaCon409SinBody(): void {
    servicioAlumnos.crearHijo.and.rejectWith(new HttpErrorResponse({ status: 409 }));
  }

  function givenCrearHijoRechazaConErrorGenerico(): void {
    servicioAlumnos.crearHijo.and.rejectWith(new Error('boom'));
  }

  function whenCargoColegios(): Promise<void> {
    return presenter.cargarColegios();
  }

  function whenCargoGrados(colegioId: string): Promise<void> {
    return presenter.cargarGrados(colegioId);
  }

  function whenCreo(req: CrearHijoRequest): Promise<boolean> {
    return presenter.crear(req);
  }

  function thenSeLlamoObtenerColegiosVecesIgualA(cantidad: number): void {
    expect(servicioColegios.obtenerColegios).toHaveBeenCalledTimes(cantidad);
  }

  function thenSeMostroToast(mensaje: string, tipo: 'success' | 'error'): void {
    expect(servicioToast.mostrar).toHaveBeenCalledWith(mensaje, tipo);
  }

  function thenSeNavegoA(url: string): void {
    expect(router.navigateByUrl).toHaveBeenCalledWith(url);
  }
});
