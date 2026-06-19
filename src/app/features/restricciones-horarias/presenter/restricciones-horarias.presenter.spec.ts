import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RestriccionesHorariasPresenter } from './restricciones-horarias.presenter';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { RestriccionesHorariasService } from '../services/restricciones-horarias.service';
import { FranjasHorariasService } from '../services/franjas-horarias.service';
import { RestriccionesNutricionalesService } from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { ProductService } from '../../updated-inventory/services/product.service';
import { of } from 'rxjs';

describe('RestriccionesHorariasPresenter', () => {
  let presenter: RestriccionesHorariasPresenter;
  let alumnosServiceMock: jasmine.SpyObj<AlumnosService>;
  let restriccionesServiceMock: jasmine.SpyObj<RestriccionesHorariasService>;
  let franjasServiceMock: jasmine.SpyObj<FranjasHorariasService>;
  let nutricionalesServiceMock: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let productServiceMock: jasmine.SpyObj<ProductService>;

  beforeEach(() => {
    alumnosServiceMock = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    restriccionesServiceMock = jasmine.createSpyObj('RestriccionesHorariasService', ['getRestriccionesPorAlumno', 'crearRestriccion', 'deshabilitarRestriccion']);
    franjasServiceMock = jasmine.createSpyObj('FranjasHorariasService', ['getFranjasHorarias']);
    nutricionalesServiceMock = jasmine.createSpyObj('RestriccionesNutricionalesService', ['getCatalogo', 'getRestriccionesAlumno']);
    productServiceMock = jasmine.createSpyObj('ProductService', ['getCategories']);

    TestBed.configureTestingModule({
      providers: [
        RestriccionesHorariasPresenter,
        { provide: AlumnosService, useValue: alumnosServiceMock },
        { provide: RestriccionesHorariasService, useValue: restriccionesServiceMock },
        { provide: FranjasHorariasService, useValue: franjasServiceMock },
        { provide: RestriccionesNutricionalesService, useValue: nutricionalesServiceMock },
        { provide: ProductService, useValue: productServiceMock }
      ]
    });

    presenter = TestBed.inject(RestriccionesHorariasPresenter);

    // Default mocks setup
    alumnosServiceMock.asegurarCargados.and.returnValue(Promise.resolve() as unknown as never);
    alumnosServiceMock.getAlumnoById.and.returnValue({ id: 'a1', colegioId: 'c1' } as unknown as import('../../../data-access/models/alumno.model').Alumno);
    franjasServiceMock.getFranjasHorarias.and.returnValue(Promise.resolve([{ id: 'ts1', descripcion: 'Recreo 1' }] as unknown as never[]));
    restriccionesServiceMock.getRestriccionesPorAlumno.and.returnValue(Promise.resolve([{ id: 'r1', activa: true, timeSlotId: 'ts1', categoryId: 'cat1' }] as unknown as import('../models/restriccion-horaria.model').RestriccionHoraria[]));
    nutricionalesServiceMock.getCatalogo.and.returnValue(Promise.resolve([{ id: 'sal1', descripcion: 'Salud 1' }]));
    nutricionalesServiceMock.getRestriccionesAlumno.and.returnValue(Promise.resolve([{ id: 'salGlobal1', descripcion: 'Salud Global' }]));
    productServiceMock.getCategories.and.returnValue(of([{ id: 'cat1', descripcion: 'Categoria 1' }, { id: 'cat2', descripcion: 'Categoria 2' }] as unknown as import('../../updated-inventory/models/category.interface').Category[]));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('dado que inicializa, deberia cargar alumno y datos relacionados', fakeAsync(() => {
    presenter.init('a1');
    tick();

    expect(presenter.alumno()?.id).toBe('a1');
    expect(presenter.cargando()).toBeFalse();
    expect(presenter.categorias().length).toBe(2);

    const disponibles = presenter.catalogoSaludDisponible();
    expect(disponibles.length).toBe(1);
    expect(disponibles[0].id).toBe('sal1');

    const franjasConRest = presenter.franjasConRestricciones();
    expect(franjasConRest.length).toBe(1);
    expect(franjasConRest[0].franja.id).toBe('ts1');
    expect(franjasConRest[0].restricciones.length).toBe(1);
    expect(franjasConRest[0].categoriasDisponibles.length).toBe(1); // cat2
  }));

  it('dado que agregarRestriccion categoria es llamado, deberia delegar en servicio y actualizar', fakeAsync(() => {
    restriccionesServiceMock.crearRestriccion.and.returnValue(Promise.resolve({} as unknown as import('../models/restriccion-horaria.model').RestriccionHoraria));
    restriccionesServiceMock.getRestriccionesPorAlumno.and.returnValue(Promise.resolve([
      { id: 'r1', activa: true, timeSlotId: 'ts1', categoryId: 'cat1' },
      { id: 'r2', activa: true, timeSlotId: 'ts1', categoryId: 'cat2' }
    ] as unknown as import('../models/restriccion-horaria.model').RestriccionHoraria[]));

    presenter.init('a1');
    tick();

    presenter.agregarRestriccion('ts1', 'CATEGORIA', 'cat2');
    tick();

    expect(restriccionesServiceMock.crearRestriccion).toHaveBeenCalledWith({
      studentId: 'a1', timeSlotId: 'ts1', categoryId: 'cat2', classificationId: null
    });
    
    const franjas = presenter.franjasConRestricciones();
    expect(franjas[0].restricciones.length).toBe(2);
  }));

  it('dado que quitarRestriccion es llamado, deberia delegar en servicio', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    restriccionesServiceMock.deshabilitarRestriccion.and.returnValue(Promise.resolve());

    presenter.init('a1');
    tick();

    presenter.quitarRestriccion('r1');
    tick();

    expect(restriccionesServiceMock.deshabilitarRestriccion).toHaveBeenCalledWith('r1');
    const franjas = presenter.franjasConRestricciones();
    expect(franjas[0].restricciones.length).toBe(0);
  }));

  it('dado que quitarRestriccion falla, deberia mostrar alert', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    restriccionesServiceMock.deshabilitarRestriccion.and.callFake(() => Promise.reject(new Error('error')));

    presenter.init('a1');
    tick();

    presenter.quitarRestriccion('r1');
    tick();

    expect(window.alert).toHaveBeenCalledWith('No se pudo eliminar la restricción. Intentá de nuevo más tarde.');
  }));
});
