import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { RestriccionesNutricionalesService } from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import {
  ALUMNO_ID_TEST,
  CategoriaProductoMother,
  ClasificacionSaludBackendMother,
  COLEGIO_ID_TEST,
  RestriccionHorariaMother,
  TimeSlotMother,
} from '../restricciones-horarias.mother';
import { RestriccionHoraria } from '../models/restriccion-horaria.model';
import { FranjasHorariasService } from '../services/franjas-horarias.service';
import { RestriccionesHorariasService } from '../services/restricciones-horarias.service';
import { RestriccionesHorariasPresenter } from './restricciones-horarias.presenter';

describe('RestriccionesHorariasPresenter', () => {
  let presenter: RestriccionesHorariasPresenter;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let restriccionesService: jasmine.SpyObj<RestriccionesHorariasService>;
  let franjasService: jasmine.SpyObj<FranjasHorariasService>;
  let nutricionalesService: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let productService: jasmine.SpyObj<ProductoService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(() => {
    alumnosService = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    restriccionesService = jasmine.createSpyObj<RestriccionesHorariasService>(
      'RestriccionesHorariasService',
      ['getRestriccionesPorAlumno', 'crearRestriccion', 'actualizarRestriccion', 'deshabilitarRestriccion'],
    );
    franjasService = jasmine.createSpyObj<FranjasHorariasService>(
      'FranjasHorariasService',
      ['getFranjasHorarias'],
    );
    nutricionalesService = jasmine.createSpyObj<RestriccionesNutricionalesService>(
      'RestriccionesNutricionalesService',
      ['getCatalogo', 'getRestriccionesAlumno', 'actualizarRestricciones'],
    );
    productService = jasmine.createSpyObj<ProductoService>('ProductoService', ['getCategories']);
    dialogService = jasmine.createSpyObj<DialogService>('DialogService', ['alert']);

    alumnosService.asegurarCargados.and.resolveTo([]);
    alumnosService.getAlumnoById.and.returnValue(
      AlumnoMother.crear({ id: ALUMNO_ID_TEST, colegioId: COLEGIO_ID_TEST, nombre: 'Julián' }),
    );
    franjasService.getFranjasHorarias.and.resolveTo(TimeSlotMother.crearVarios());
    restriccionesService.getRestriccionesPorAlumno.and.resolveTo([]);
    nutricionalesService.getCatalogo.and.resolveTo(ClasificacionSaludBackendMother.crearVarias());
    nutricionalesService.getRestriccionesAlumno.and.resolveTo([]);
    productService.getCategories.and.returnValue(
      of(CategoriaProductoMother.crearVarias().map((c) => ({ ...c, activo: true }))),
    );
    dialogService.alert.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        RestriccionesHorariasPresenter,
        { provide: AlumnosService, useValue: alumnosService },
        { provide: RestriccionesHorariasService, useValue: restriccionesService },
        { provide: FranjasHorariasService, useValue: franjasService },
        { provide: RestriccionesNutricionalesService, useValue: nutricionalesService },
        { provide: ProductoService, useValue: productService },
        { provide: DialogService, useValue: dialogService },
      ],
    });

    presenter = TestBed.inject(RestriccionesHorariasPresenter);
  });

  describe('init', () => {
    it('dado un alumnoId valido, cuando inicializo, deberia cargar alumno, franjas, restricciones y catalogos', async () => {
      await presenter.init(ALUMNO_ID_TEST);

      expect(alumnosService.asegurarCargados).toHaveBeenCalled();
      expect(alumnosService.getAlumnoById).toHaveBeenCalledWith(ALUMNO_ID_TEST);
      expect(franjasService.getFranjasHorarias).toHaveBeenCalledWith(COLEGIO_ID_TEST);
      expect(restriccionesService.getRestriccionesPorAlumno).toHaveBeenCalledWith(ALUMNO_ID_TEST);
      expect(presenter.alumno()?.id).toBe(ALUMNO_ID_TEST);
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado que el alumno no existe, cuando inicializo, no deberia pedir franjas ni restricciones', async () => {
      givenAlumnoInexistente();

      await presenter.init('inexistente');

      expect(franjasService.getFranjasHorarias).not.toHaveBeenCalled();
      expect(restriccionesService.getRestriccionesPorAlumno).not.toHaveBeenCalled();
      expect(presenter.alumno()).toBeUndefined();
    });

    it('dado que el back falla, cuando inicializo, deberia dejar cargando en false', async () => {
      spyOn(console, 'error');
      givenGetFranjasFalla();

      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('franjasConRestricciones', () => {
    it('dado un alumno con restricciones activas, cuando proyecto, deberia agruparlas por franja', async () => {
      givenRestriccionesDelAlumno([
        RestriccionHorariaMother.crearPorCategoria({ timeSlotId: 'ts-001' }),
        RestriccionHorariaMother.crearPorSalud({ timeSlotId: 'ts-002' }),
      ]);

      await presenter.init(ALUMNO_ID_TEST);

      const franjas = presenter.franjasConRestricciones();
      expect(franjas.length).toBe(2);
      expect(franjas[0].restricciones.length).toBe(1);
      expect(franjas[0].restricciones[0].categoria?.id).toBe('cat-bebidas');
      expect(franjas[1].restricciones[0].clasificacionSalud?.id).toBe('salud-tacc');
    });

    it('dado un bloqueo total, cuando proyecto la franja, deberia marcar tieneBloqueoTotal', async () => {
      givenRestriccionesDelAlumno([RestriccionHorariaMother.crearBloqueoTotal({ timeSlotId: 'ts-001' })]);

      await presenter.init(ALUMNO_ID_TEST);

      const franjas = presenter.franjasConRestricciones();
      expect(franjas[0].tieneBloqueoTotal).toBeTrue();
      expect(franjas[1].tieneBloqueoTotal).toBeFalse();
    });

    it('dado que una categoria ya esta restringida, cuando proyecto, no deberia estar entre las disponibles', async () => {
      givenRestriccionesDelAlumno([RestriccionHorariaMother.crearPorCategoria({ timeSlotId: 'ts-001' })]);

      await presenter.init(ALUMNO_ID_TEST);

      const bebidasEnDisponibles = presenter
        .franjasConRestricciones()[0]
        .categoriasDisponibles.find((c) => c.id === 'cat-bebidas');
      expect(bebidasEnDisponibles).toBeUndefined();
    });

    it('dado una restriccion inactiva, cuando proyecto, no deberia incluirla', async () => {
      givenRestriccionesDelAlumno([
        RestriccionHorariaMother.crearPorCategoria({ timeSlotId: 'ts-001', activa: false }),
      ]);

      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.franjasConRestricciones()[0].restricciones.length).toBe(0);
    });
  });

  describe('agregarRestriccion', () => {
    it('dado una categoria, cuando la agrego, deberia sumarla al draft con categoryId seteado', async () => {
      await presenter.init(ALUMNO_ID_TEST);

      presenter.agregarRestriccion('ts-001', 'CATEGORIA', 'cat-bebidas');

      const franja = presenter.franjasConRestricciones()[0];
      expect(franja.restricciones.length).toBe(1);
      expect(franja.restricciones[0].categoryId).toBe('cat-bebidas');
    });

    it('dado un bloqueo total, cuando lo agrego, deberia crear una restriccion sin categoria ni salud', async () => {
      await presenter.init(ALUMNO_ID_TEST);

      presenter.agregarRestriccion('ts-001', 'TOTAL');

      expect(presenter.franjasConRestricciones()[0].tieneBloqueoTotal).toBeTrue();
    });

    it('dado que no hay alumno, cuando agrego una restriccion, no deberia hacer nada', () => {
      presenter.agregarRestriccion('ts-001', 'CATEGORIA', 'cat-bebidas');

      expect(presenter.franjasConRestricciones().length).toBe(0);
    });
  });

  describe('quitarRestriccion', () => {
    it('dado una restriccion cargada, cuando la quito, deberia sacarla del draft', async () => {
      givenRestriccionesDelAlumno([
        RestriccionHorariaMother.crearPorCategoria({ id: 'restriccion-cat', timeSlotId: 'ts-001' }),
      ]);
      await presenter.init(ALUMNO_ID_TEST);

      presenter.quitarRestriccion('restriccion-cat');

      expect(presenter.franjasConRestricciones()[0].restricciones.length).toBe(0);
    });
  });

  describe('getNombreCategoria y getNombreSalud', () => {
    it('dado un id de categoria conocido, cuando pido el nombre, deberia devolver su descripcion', async () => {
      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.getNombreCategoria('cat-bebidas')).toBe('Bebidas');
      expect(presenter.getNombreCategoria('cat-inexistente')).toBe('Categoría');
    });

    it('dado un id de salud conocido, cuando pido el nombre, deberia devolver su descripcion', async () => {
      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.getNombreSalud('salud-tacc')).toBe('Sin TACC');
      expect(presenter.getNombreSalud('salud-inexistente')).toBe('Restricción');
    });
  });

  describe('guardarCambios', () => {
    it('dado que no hay alumno cargado, cuando guardo, deberia devolver false sin llamar al service', async () => {
      const resultado = await presenter.guardarCambios();

      expect(resultado).toBeFalse();
      expect(restriccionesService.crearRestriccion).not.toHaveBeenCalled();
    });

    it('dado una restriccion nueva manejable, cuando guardo, deberia hacer POST y mostrar alerta de exito', async () => {
      await presenter.init(ALUMNO_ID_TEST);
      presenter.agregarRestriccion('ts-001', 'CATEGORIA', 'cat-bebidas');
      restriccionesService.crearRestriccion.and.resolveTo(RestriccionHorariaMother.crearPorCategoria());

      const resultado = await presenter.guardarCambios();

      expect(restriccionesService.crearRestriccion).toHaveBeenCalledWith(
        jasmine.objectContaining({ studentId: ALUMNO_ID_TEST, timeSlotId: 'ts-001', categoryId: 'cat-bebidas' }),
      );
      expect(dialogService.alert).toHaveBeenCalledWith('Configuración guardada con éxito.', 'Éxito');
      expect(resultado).toBeTrue();
    });

    it('dado una restriccion manejable eliminada, cuando guardo, deberia hacer PATCH de disable', async () => {
      const restriccionExistente = RestriccionHorariaMother.crearPorCategoria({
        id: 'restriccion-cat',
        timeSlotId: 'ts-001',
      });
      givenRestriccionesDelAlumno([restriccionExistente]);
      await presenter.init(ALUMNO_ID_TEST);
      presenter.quitarRestriccion('restriccion-cat');

      await presenter.guardarCambios();

      expect(restriccionesService.deshabilitarRestriccion).toHaveBeenCalledWith('restriccion-cat');
    });

    it('dado que falla el service, cuando guardo, deberia mostrar alerta de error y devolver false', async () => {
      spyOn(console, 'error');
      await presenter.init(ALUMNO_ID_TEST);
      presenter.agregarRestriccion('ts-001', 'CATEGORIA', 'cat-bebidas');
      restriccionesService.crearRestriccion.and.rejectWith(new Error('boom'));

      const resultado = await presenter.guardarCambios();

      expect(resultado).toBeFalse();
      expect(dialogService.alert).toHaveBeenCalledWith(
        'Ocurrió un error al intentar guardar los cambios. Intentá de nuevo más tarde.',
        'Error',
      );
    });
  });

  function givenAlumnoInexistente(): void {
    alumnosService.getAlumnoById.and.returnValue(undefined);
  }

  function givenGetFranjasFalla(): void {
    franjasService.getFranjasHorarias.and.rejectWith(new Error('boom'));
  }

  function givenRestriccionesDelAlumno(restricciones: RestriccionHoraria[]): void {
    restriccionesService.getRestriccionesPorAlumno.and.resolveTo(restricciones);
  }
});
