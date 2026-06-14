import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Alumno } from '../../../data-access/models/alumno.model';
import { Colegio } from '../../../data-access/models/colegio.model';
import { Grado } from '../../../data-access/models/grado.model';
import { CrearHijoPresenter } from './crear-hijo.presenter';

describe('CrearHijoPresenter', () => {
  let presenter: CrearHijoPresenter;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let colegiosServiceSpy: jasmine.SpyObj<ColegiosService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockColegios: Colegio[] = [
    { id: 'colegio-1', nombre: 'Instituto San José' },
    { id: 'colegio-2', nombre: 'Colegio Santa María' },
  ];

  const mockGrados: Grado[] = [
    { id: 'grado-1', nombre: '5to A' },
    { id: 'grado-2', nombre: '6to B' },
  ];

  const mockAlumnoCreado: Alumno = {
    id: 'alumno-nuevo',
    nombre: 'Juan',
    apellido: 'Pérez',
    grado: '5to A',
    colegioId: 'colegio-1',
    saldo: 0,
  };

  beforeEach(() => {
    alumnosServiceSpy = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'crearHijo',
    ]);
    colegiosServiceSpy = jasmine.createSpyObj<ColegiosService>(
      'ColegiosService',
      ['obtenerColegios', 'obtenerGradosPorColegio'],
    );
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', [
      'mostrar',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        CrearHijoPresenter,
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: ColegiosService, useValue: colegiosServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    presenter = TestBed.inject(CrearHijoPresenter);
  });

  it('debería crearse el presenter', () => {
    expect(presenter).toBeTruthy();
    expect(presenter.colegios()).toEqual([]);
    expect(presenter.grados()).toEqual([]);
    expect(presenter.guardando()).toBeFalse();
    expect(presenter.error()).toBeNull();
  });

  describe('cargarColegios', () => {
    it('debería traer colegios del back y exponerlos en el signal', async () => {
      colegiosServiceSpy.obtenerColegios.and.resolveTo(mockColegios);

      await presenter.cargarColegios();

      expect(colegiosServiceSpy.obtenerColegios).toHaveBeenCalledTimes(1);
      expect(presenter.colegios()).toEqual(mockColegios);
      expect(presenter.cargandoColegios()).toBeFalse();
    });

    it('no debería volver a llamar al back si ya hay colegios cargados', async () => {
      colegiosServiceSpy.obtenerColegios.and.resolveTo(mockColegios);
      await presenter.cargarColegios();

      await presenter.cargarColegios();

      expect(colegiosServiceSpy.obtenerColegios).toHaveBeenCalledTimes(1);
    });

    it('debería mostrar un toast de error si la llamada al back falla', async () => {
      colegiosServiceSpy.obtenerColegios.and.rejectWith(
        new HttpErrorResponse({ status: 500 }),
      );

      await presenter.cargarColegios();

      expect(presenter.colegios()).toEqual([]);
      expect(presenter.cargandoColegios()).toBeFalse();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
        'No se pudieron cargar los colegios.',
        'error',
      );
    });
  });

  describe('cargarGrados', () => {
    it('debería traer los grados del colegio elegido', async () => {
      colegiosServiceSpy.obtenerGradosPorColegio.and.resolveTo(mockGrados);

      await presenter.cargarGrados('colegio-1');

      expect(colegiosServiceSpy.obtenerGradosPorColegio).toHaveBeenCalledWith(
        'colegio-1',
      );
      expect(presenter.grados()).toEqual(mockGrados);
      expect(presenter.cargandoGrados()).toBeFalse();
    });

    it('debería resetear los grados y no pegarle al back si el colegioId es vacío', async () => {
      colegiosServiceSpy.obtenerGradosPorColegio.and.resolveTo(mockGrados);
      await presenter.cargarGrados('colegio-1');
      expect(presenter.grados().length).toBe(2);

      await presenter.cargarGrados('');

      expect(presenter.grados()).toEqual([]);
      expect(
        colegiosServiceSpy.obtenerGradosPorColegio,
      ).toHaveBeenCalledTimes(1);
    });

    it('debería mostrar un toast de error si la llamada al back falla', async () => {
      colegiosServiceSpy.obtenerGradosPorColegio.and.rejectWith(
        new HttpErrorResponse({ status: 500 }),
      );

      await presenter.cargarGrados('colegio-1');

      expect(presenter.grados()).toEqual([]);
      expect(presenter.cargandoGrados()).toBeFalse();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
        'No se pudieron cargar los grados.',
        'error',
      );
    });
  });

  describe('crear', () => {
    const reqValido = {
      nombre: 'Juan',
      apellido: 'Pérez',
      username: 'juan.perez',
      email: 'juan.perez@example.com',
      dni: '40123456',
      gradoId: 'grado-1',
    };

    it('debería crear el hijo, mostrar toast y navegar a /tutor', async () => {
      alumnosServiceSpy.crearHijo.and.resolveTo(mockAlumnoCreado);

      const ok = await presenter.crear(reqValido);

      expect(ok).toBeTrue();
      expect(alumnosServiceSpy.crearHijo).toHaveBeenCalledWith(reqValido);
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
        'Juan Pérez fue agregado como hijo',
        'success',
      );
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(presenter.guardando()).toBeFalse();
      expect(presenter.error()).toBeNull();
    });

    it('no debería disparar dos creaciones simultáneas', async () => {
      let resolverCreacion!: (alumno: Alumno) => void;
      alumnosServiceSpy.crearHijo.and.returnValue(
        new Promise<Alumno>((resolve) => {
          resolverCreacion = resolve;
        }),
      );

      const primera = presenter.crear(reqValido);
      const segunda = presenter.crear(reqValido);

      const resultadoSegunda = await segunda;
      expect(resultadoSegunda).toBeFalse();

      resolverCreacion(mockAlumnoCreado);
      await primera;

      expect(alumnosServiceSpy.crearHijo).toHaveBeenCalledTimes(1);
    });

    it('debería mostrar el mensaje del back si viene en el error 409', async () => {
      alumnosServiceSpy.crearHijo.and.rejectWith(
        new HttpErrorResponse({
          status: 409,
          error: { message: 'El DNI ya existe' },
        }),
      );

      const ok = await presenter.crear(reqValido);

      expect(ok).toBeFalse();
      expect(presenter.error()).toBe('El DNI ya existe');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith(
        'El DNI ya existe',
        'error',
      );
      expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
    });

    it('debería usar mensaje por defecto para 409 sin body', async () => {
      alumnosServiceSpy.crearHijo.and.rejectWith(
        new HttpErrorResponse({ status: 409 }),
      );

      await presenter.crear(reqValido);

      expect(presenter.error()).toBe('Ya existe un alumno con esos datos.');
    });

    it('debería usar mensaje genérico para errores no-HTTP', async () => {
      alumnosServiceSpy.crearHijo.and.rejectWith(new Error('boom'));

      await presenter.crear(reqValido);

      expect(presenter.error()).toBe(
        'No se pudo crear el hijo. Intenta nuevamente.',
      );
    });
  });
});
