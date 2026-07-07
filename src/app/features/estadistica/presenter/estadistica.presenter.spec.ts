import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { PrediccionGastoMother } from '../estadistica.mother';
import { EstadisticaPresenter } from './estadistica.presenter';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { of } from 'rxjs';

describe('EstadisticaPresenter', () => {
  let presenter: EstadisticaPresenter;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;
  let servicioMovimientos: jasmine.SpyObj<MovimientosService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);
    servicioAlumnos.getAlumnoById.and.returnValue(undefined);

    servicioPresupuesto = jasmine.createSpyObj('PresupuestoService', ['cargarPrediccion']);
    servicioPresupuesto.cargarPrediccion.and.resolveTo(undefined);

    servicioMovimientos = jasmine.createSpyObj('MovimientosService', ['getHistorialAlumno']);
    servicioMovimientos.getHistorialAlumno.and.returnValue(of([]));

    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        EstadisticaPresenter,
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        { provide: MovimientosService, useValue: servicioMovimientos },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(EstadisticaPresenter);
  });

  describe('Estado inicial', () => {
    it('dado el presenter recien creado, deberia estar sin alumno ni prediccion', () => {
      expect(presenter.alumno()).toBeUndefined();
      expect(presenter.prediccion()).toBeUndefined();
      expect(presenter.nombreCompleto()).toBe('');
      expect(presenter.grado()).toBe('');
      expect(presenter.iniciales()).toBe('');
      expect(presenter.urlFotoPerfil()).toBeNull();
      expect(presenter.nivelAlerta()).toBe('ok');
    });
  });

  describe('init', () => {
    it('dado un alumno existente, cuando inicializo, deberia setearlo con sus datos y su prediccion', async () => {
      givenAlumnoEncontrado(
        AlumnoMother.crear({
          id: 'alumno-1',
          nombre: 'Juan Ignacio',
          apellido: 'Perez',
          grado: '5A',
          urlFotoPerfil: 'https://foto.com/j.png',
        }),
      );
      servicioPresupuesto.cargarPrediccion.and.resolveTo(PrediccionGastoMother.crear());

      await whenInit('alumno-1');

      expect(presenter.alumno()?.id).toBe('alumno-1');
      expect(presenter.nombreCompleto()).toBe('Juan');
      expect(presenter.grado()).toBe('5A');
      expect(presenter.iniciales()).toBe('JP');
      expect(presenter.urlFotoPerfil()).toBe('https://foto.com/j.png');
      expect(presenter.prediccion()).toBeDefined();
    });

    it('dado un alumno sin nombre ni apellido, cuando inicializo, iniciales y nombreCompleto deberian ser vacios', async () => {
      givenAlumnoEncontrado(AlumnoMother.crear({ nombre: '', apellido: '' }));

      await whenInit('alumno-1');

      expect(presenter.nombreCompleto()).toBe('');
      expect(presenter.iniciales()).toBe('');
    });

    it('dado que el alumno no existe, cuando inicializo, deberia redirigir a /tutor sin setear alumno', async () => {
      givenAlumnoNoEncontrado();

      await whenInit('alumno-inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(presenter.alumno()).toBeUndefined();
      expect(servicioPresupuesto.cargarPrediccion).not.toHaveBeenCalled();
    });
  });

  describe('nivelAlerta segun la prediccion', () => {
    it('dado prediccion en 50%, nivelAlerta deberia ser "ok"', async () => {
      await givenAlumnoYPrediccion(PrediccionGastoMother.crear({ porcentajePresupuesto: 50 }));

      expect(presenter.nivelAlerta()).toBe('ok');
    });

    it('dado prediccion en 80%, nivelAlerta deberia ser "warning"', async () => {
      await givenAlumnoYPrediccion(PrediccionGastoMother.crearWarning());

      expect(presenter.nivelAlerta()).toBe('warning');
    });

    it('dado prediccion en 120%, nivelAlerta deberia ser "excedido"', async () => {
      await givenAlumnoYPrediccion(PrediccionGastoMother.crearExcedido());

      expect(presenter.nivelAlerta()).toBe('excedido');
    });
  });

  describe('volver', () => {
    it('dado el presenter, cuando llamo volver, deberia navegar a /tutor', () => {
      presenter.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  function givenAlumnoEncontrado(alumno: ReturnType<typeof AlumnoMother.crear>): void {
    servicioAlumnos.getAlumnoById.and.returnValue(alumno);
  }

  function givenAlumnoNoEncontrado(): void {
    servicioAlumnos.getAlumnoById.and.returnValue(undefined);
  }

  async function givenAlumnoYPrediccion(prediccion: ReturnType<typeof PrediccionGastoMother.crear>): Promise<void> {
    servicioAlumnos.getAlumnoById.and.returnValue(AlumnoMother.crear({ id: 'alumno-1' }));
    servicioPresupuesto.cargarPrediccion.and.resolveTo(prediccion);
    await presenter.init('alumno-1');
  }

  async function whenInit(alumnoId: string): Promise<void> {
    await presenter.init(alumnoId);
  }
});
