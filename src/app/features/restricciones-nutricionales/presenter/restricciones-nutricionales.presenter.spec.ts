import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ClasificacionSaludBackend,
  RestriccionesNutricionalesService,
} from '../services/restricciones-nutricionales.service';
import { RestriccionesHorariasService } from '../../restricciones-horarias/services/restricciones-horarias.service';
import { FranjasHorariasService } from '../../restricciones-horarias/services/franjas-horarias.service';
import { RestriccionesNutricionalesPresenter } from './restricciones-nutricionales.presenter';
import { RestriccionHoraria } from '../../restricciones-horarias/models/restriccion-horaria.model';

describe('RestriccionesNutricionalesPresenter', () => {
  const alumnoMock: Alumno = {
    id: 'alumno-42',
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: 'colegio-1',
    saldo: 0,
  };

  const catalogoMock: ClasificacionSaludBackend[] = [
    { id: 'uuid-tacc', descripcion: 'Sin TACC', activo: true },
    { id: 'uuid-azucar', descripcion: 'Sin Azúcar', activo: true },
    { id: 'uuid-sodio', descripcion: 'Sin Sodio', activo: true },
    { id: 'uuid-vegano', descripcion: 'Apto Vegano', activo: true },
    { id: 'uuid-lacteos', descripcion: 'Contiene Lácteos', activo: true },
    { id: 'uuid-inactivo', descripcion: 'Sin TACC obsoleta', activo: false },
  ];

  let presenter: RestriccionesNutricionalesPresenter;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let restriccionesService: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let restriccionesHorariasService: jasmine.SpyObj<RestriccionesHorariasService>;
  let franjasHorariasService: jasmine.SpyObj<FranjasHorariasService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    alumnosService = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    restriccionesService = jasmine.createSpyObj<RestriccionesNutricionalesService>(
      'RestriccionesNutricionalesService',
      ['getCatalogo', 'getRestriccionesAlumno', 'actualizarRestricciones'],
    );
    restriccionesHorariasService = jasmine.createSpyObj<RestriccionesHorariasService>(
      'RestriccionesHorariasService',
      ['getRestriccionesPorAlumno', 'crearRestriccion', 'deshabilitarRestriccion'],
    );
    franjasHorariasService = jasmine.createSpyObj<FranjasHorariasService>(
      'FranjasHorariasService',
      ['getFranjasHorarias'],
    );
    toastService = jasmine.createSpyObj<ToastService>('ToastService', [
      'mostrar',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    alumnosService.asegurarCargados.and.resolveTo([alumnoMock]);
    alumnosService.getAlumnoById.and.returnValue(alumnoMock);
    restriccionesService.getCatalogo.and.resolveTo(catalogoMock);
    restriccionesService.getRestriccionesAlumno.and.resolveTo([]);
    restriccionesService.actualizarRestricciones.and.resolveTo();
    restriccionesHorariasService.getRestriccionesPorAlumno.and.resolveTo([]);
    restriccionesHorariasService.crearRestriccion.and.resolveTo({} as RestriccionHoraria);
    restriccionesHorariasService.deshabilitarRestriccion.and.resolveTo();
    franjasHorariasService.getFranjasHorarias.and.resolveTo([]);

    TestBed.configureTestingModule({
      providers: [
        RestriccionesNutricionalesPresenter,
        { provide: AlumnosService, useValue: alumnosService },
        { provide: RestriccionesNutricionalesService, useValue: restriccionesService },
        { provide: RestriccionesHorariasService, useValue: restriccionesHorariasService },
        { provide: FranjasHorariasService, useValue: franjasHorariasService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(RestriccionesNutricionalesPresenter);
  });

  describe('init', () => {
    it('redirige a /tutor si el alumno no existe', async () => {
      alumnosService.getAlumnoById.and.returnValue(undefined);

      await presenter.init('inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(restriccionesService.getCatalogo).not.toHaveBeenCalled();
    });

    it('carga el alumno y proyecta las restricciones activas', async () => {
      restriccionesService.getRestriccionesAlumno.and.resolveTo([
        { id: 'uuid-tacc', descripcion: 'Sin TACC' },
        { id: 'uuid-sodio', descripcion: 'Sin Sodio' },
      ]);

      await presenter.init('alumno-42');

      expect(presenter.alumno()).toEqual(alumnoMock);
      expect(presenter.nombreCompleto()).toBe('Julián García');
      expect(presenter.iniciales()).toBe('JG');
      expect(presenter.grado()).toBe('4to Año A');
      expect(presenter.restricciones()).toEqual({
        sinTacc: true,
        sinAzucar: false,
        sinSodio: true,
        vegano: false,
        contieneLacteos: false,
        tieneMani: false,
        contieneHuevo: false,
        contienePescado: false,
        contieneSoja: false,
        aptoVegetariano: false,
      });
      expect(presenter.cargando()).toBeFalse();
    });

    it('ignora clasificaciones del catálogo marcadas como inactivas', async () => {
      restriccionesService.getRestriccionesAlumno.and.resolveTo([
        { id: 'uuid-inactivo', descripcion: 'Sin TACC obsoleta', activo: false },
      ]);

      await presenter.init('alumno-42');

      expect(presenter.restricciones().sinTacc).toBeFalse();
    });

    it('muestra un toast de error si falla la carga', async () => {
      spyOn(console, 'error');
      restriccionesService.getCatalogo.and.callFake(async () => { throw new Error('boom'); });

      await presenter.init('alumno-42');

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'No pudimos cargar las restricciones del alumno.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('alternar', () => {
    it('togglea el valor sin tocar el resto', async () => {
      await presenter.init('alumno-42');

      presenter.alternar('vegano');
      expect(presenter.restricciones().vegano).toBeTrue();
      expect(presenter.restricciones().sinTacc).toBeFalse();

      presenter.alternar('vegano');
      expect(presenter.restricciones().vegano).toBeFalse();
    });
  });

  describe('guardar', () => {
    it('manda los UUIDs de los toggles activos y redirige a /tutor', async () => {
      await presenter.init('alumno-42');
      presenter.alternar('sinTacc');
      presenter.alternar('contieneLacteos');

      await presenter.guardar();

      expect(restriccionesService.actualizarRestricciones).toHaveBeenCalledWith(
        'alumno-42',
        jasmine.arrayWithExactContents(['uuid-tacc', 'uuid-lacteos']),
      );
      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Restricciones actualizadas.',
        'success',
      );
      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(presenter.guardando()).toBeFalse();
    });

    it('manda lista vacía cuando no hay toggles activos', async () => {
      await presenter.init('alumno-42');

      await presenter.guardar();

      expect(restriccionesService.actualizarRestricciones).toHaveBeenCalledWith(
        'alumno-42',
        [],
      );
    });

    it('no hace nada si init nunca corrió (alumnoId vacío)', async () => {
      await presenter.guardar();

      expect(restriccionesService.actualizarRestricciones).not.toHaveBeenCalled();
    });

    it('muestra un toast de error si falla el guardado', async () => {
      spyOn(console, 'error');
      restriccionesService.actualizarRestricciones.and.callFake(async () => { throw new Error('boom'); });
      await presenter.init('alumno-42');

      await presenter.guardar();

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'No pudimos guardar los cambios. Probá de nuevo.',
        'error',
      );
      expect(router.navigateByUrl).not.toHaveBeenCalledWith('/tutor');
      expect(presenter.guardando()).toBeFalse();
    });
  });

  describe('volver', () => {
    it('navega a /tutor', () => {
      presenter.volver();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });
});
