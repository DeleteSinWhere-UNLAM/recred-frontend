import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnoMother } from '../../data-access/services/alumno.mother';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { DialogService } from '../../shared/services/dialog.service';
import { ProductoService } from '../inventario/services/producto.service';
import { RestriccionesNutricionalesService } from '../restricciones-nutricionales/services/restricciones-nutricionales.service';
import {
  ALUMNO_ID_TEST,
  CategoriaProductoMother,
  ClasificacionSaludBackendMother,
  COLEGIO_ID_TEST,
  RestriccionHorariaMother,
  TimeSlotMother,
} from './restricciones-horarias.mother';
import { RestriccionesHorariasPage } from './restricciones-horarias.page';
import { FranjasHorariasService } from './services/franjas-horarias.service';
import { RestriccionesHorariasService } from './services/restricciones-horarias.service';

describe('RestriccionesHorarias Integration', () => {
  let fixture: ComponentFixture<RestriccionesHorariasPage>;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let restriccionesService: jasmine.SpyObj<RestriccionesHorariasService>;
  let franjasService: jasmine.SpyObj<FranjasHorariasService>;
  let nutricionalesService: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let productService: jasmine.SpyObj<ProductoService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  beforeEach(async () => {
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
    restriccionesService.getRestriccionesPorAlumno.and.resolveTo([
      RestriccionHorariaMother.crearPorCategoria({ timeSlotId: 'ts-001' }),
    ]);
    nutricionalesService.getCatalogo.and.resolveTo(ClasificacionSaludBackendMother.crearVarias());
    nutricionalesService.getRestriccionesAlumno.and.resolveTo([]);
    productService.getCategories.and.returnValue(
      of(CategoriaProductoMother.crearVarias().map((c) => ({ ...c, activo: true }))),
    );
    dialogService.alert.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [RestriccionesHorariasPage],
      providers: [
        { provide: AlumnosService, useValue: alumnosService },
        { provide: RestriccionesHorariasService, useValue: restriccionesService },
        { provide: FranjasHorariasService, useValue: franjasService },
        { provide: RestriccionesNutricionalesService, useValue: nutricionalesService },
        { provide: ProductoService, useValue: productService },
        { provide: DialogService, useValue: dialogService },
        { provide: Location, useValue: jasmine.createSpyObj<Location>('Location', ['back']) },
        {
          provide: AlumnoContextoService,
          useValue: { alumnoId: signal(ALUMNO_ID_TEST).asReadonly() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RestriccionesHorariasPage);
  });

  it('dado el alumnoId en el contexto, cuando se monta la page, deberia pedirle al service alumno, franjas y catalogos', async () => {
    await whenMontoYEspero();

    expect(alumnosService.asegurarCargados).toHaveBeenCalled();
    expect(franjasService.getFranjasHorarias).toHaveBeenCalledWith(COLEGIO_ID_TEST);
    expect(restriccionesService.getRestriccionesPorAlumno).toHaveBeenCalledWith(ALUMNO_ID_TEST);
    expect(nutricionalesService.getCatalogo).toHaveBeenCalled();
    expect(productService.getCategories).toHaveBeenCalled();
  });

  it('dado el alumno cargado, cuando se monta la page, deberia mostrar el nombre en el titulo', async () => {
    await whenMontoYEspero();

    const titulo = (fixture.nativeElement as HTMLElement).querySelector('.restricciones__titulo');
    expect(titulo?.textContent).toContain('Julián');
  });

  it('dado que quiero agregar un bloqueo total, cuando toggle, deberia crearse una restriccion TOTAL via el service al guardar', async () => {
    await whenMontoYEspero();
    const presenter = (fixture.componentInstance as unknown as { presenter: { agregarRestriccion: (f: string, t: 'TOTAL') => void; guardarCambios: () => Promise<boolean> } }).presenter;
    restriccionesService.crearRestriccion.and.resolveTo(RestriccionHorariaMother.crearBloqueoTotal());

    presenter.agregarRestriccion('ts-002', 'TOTAL');
    await presenter.guardarCambios();

    expect(restriccionesService.crearRestriccion).toHaveBeenCalledWith(
      jasmine.objectContaining({ timeSlotId: 'ts-002', categoryId: null, classificationId: null }),
    );
    expect(dialogService.alert).toHaveBeenCalledWith('Configuración guardada con éxito.', 'Éxito');
  });

  async function whenMontoYEspero(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
