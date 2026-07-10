import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import {
  ALUMNO_ID_TEST,
  FranjaConRestriccionesMother,
  RestriccionHorariaMother,
  TimeSlotMother,
} from './restricciones-horarias.mother';
import { RestriccionesHorariasPresenter, FranjaConRestricciones } from './presenter/restricciones-horarias.presenter';
import { RestriccionesHorariasPage } from './restricciones-horarias.page';

interface PresenterFake {
  init: jasmine.Spy<(alumnoId: string) => Promise<void>>;
  alumno: ReturnType<typeof signal<{ nombre: string } | undefined>>;
  cargando: ReturnType<typeof signal<boolean>>;
  franjasConRestricciones: ReturnType<typeof signal<FranjaConRestricciones[]>>;
  categorias: ReturnType<typeof signal<unknown[]>>;
  agregarRestriccion: jasmine.Spy;
  quitarRestriccion: jasmine.Spy;
  getNombreCategoria: jasmine.Spy;
  getNombreSalud: jasmine.Spy;
  guardarCambios: jasmine.Spy<() => Promise<boolean>>;
}

describe('RestriccionesHorariasPage', () => {
  let fixture: ComponentFixture<RestriccionesHorariasPage>;
  let component: RestriccionesHorariasPage;
  let presenter: PresenterFake;
  let contextoService: { alumnoId: ReturnType<typeof signal<string>> };
  let location: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    presenter = {
      init: jasmine.createSpy('init').and.resolveTo(),
      alumno: signal<{ nombre: string } | undefined>({ nombre: 'Julián' }),
      cargando: signal(false),
      franjasConRestricciones: signal<FranjaConRestricciones[]>([]),
      categorias: signal([]),
      agregarRestriccion: jasmine.createSpy('agregarRestriccion'),
      quitarRestriccion: jasmine.createSpy('quitarRestriccion'),
      getNombreCategoria: jasmine.createSpy('getNombreCategoria').and.returnValue('Cat'),
      getNombreSalud: jasmine.createSpy('getNombreSalud').and.returnValue('Salud'),
      guardarCambios: jasmine.createSpy('guardarCambios').and.resolveTo(true),
    };
    contextoService = { alumnoId: signal(ALUMNO_ID_TEST) };
    location = jasmine.createSpyObj<Location>('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [RestriccionesHorariasPage],
      providers: [
        { provide: AlumnoContextoService, useValue: contextoService },
        { provide: Location, useValue: location },
      ],
    })
      .overrideComponent(RestriccionesHorariasPage, {
        set: { providers: [{ provide: RestriccionesHorariasPresenter, useValue: presenter }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RestriccionesHorariasPage);
    component = fixture.componentInstance;
  });

  describe('inicializacion via effect', () => {
    it('dado un alumnoId en el contexto, cuando se monta la page, deberia llamar a presenter.init', () => {
      whenMonto();

      expect(presenter.init).toHaveBeenCalledWith(ALUMNO_ID_TEST);
    });

    it('dado un alumnoId vacio, cuando se monta la page, no deberia llamar a init', () => {
      contextoService.alumnoId.set('');

      whenMonto();

      expect(presenter.init).not.toHaveBeenCalled();
    });

    it('dado franjas cargadas, cuando cambia el estado, deberia auto-seleccionar la primera franja', () => {
      const franja = FranjaConRestriccionesMother.crear({ franja: TimeSlotMother.crear() });
      presenter.franjasConRestricciones.set([franja]);

      whenMonto();

      expect(component['selectedFranjaId']()).toBe('ts-001');
    });
  });

  describe('carousel', () => {
    beforeEach(() => {
      presenter.franjasConRestricciones.set([
        FranjaConRestriccionesMother.crear({ franja: TimeSlotMother.crear() }),
        FranjaConRestriccionesMother.crear({ franja: TimeSlotMother.crearSegundo() }),
      ]);
      whenMonto();
    });

    it('dado que estoy en la primera franja, cuando hago click en anterior, no deberia poder retroceder', () => {
      component['selectedFranjaId'].set('ts-001');

      expect(component.puedeAnterior()).toBeFalse();
    });

    it('dado que estoy en la primera franja, cuando hago click en siguiente, deberia poder avanzar', () => {
      component['selectedFranjaId'].set('ts-001');

      expect(component.puedeSiguiente()).toBeTrue();
      component.siguienteFranja();
      expect(component['selectedFranjaId']()).toBe('ts-002');
    });

    it('dado que estoy en la ultima franja, cuando hago click en anterior, deberia volver a la primera', () => {
      component['selectedFranjaId'].set('ts-002');

      expect(component.puedeAnterior()).toBeTrue();
      component.anteriorFranja();
      expect(component['selectedFranjaId']()).toBe('ts-001');
    });

    it('dado que estoy en la ultima franja, cuando hago click en siguiente, no deberia poder avanzar', () => {
      component['selectedFranjaId'].set('ts-002');

      expect(component.puedeSiguiente()).toBeFalse();
    });
  });

  describe('volver', () => {
    it('cuando hago click en volver, deberia llamar a location.back', () => {
      whenMonto();

      component.volver();

      expect(location.back).toHaveBeenCalled();
    });
  });

  describe('alternarBloqueoTotal', () => {
    it('dado que NO hay bloqueo total, cuando alterno, deberia agregar una restriccion TOTAL', async () => {
      whenMonto();
      const slot = FranjaConRestriccionesMother.crear({ tieneBloqueoTotal: false });

      await component.alternarBloqueoTotal(slot);

      expect(presenter.agregarRestriccion).toHaveBeenCalledWith('ts-001', 'TOTAL');
    });

    it('dado que hay bloqueo total, cuando alterno, deberia quitar la restriccion total', async () => {
      whenMonto();
      const slot = FranjaConRestriccionesMother.crear({
        tieneBloqueoTotal: true,
        restricciones: [RestriccionHorariaMother.crearBloqueoTotal({ id: 'restriccion-total' })],
      });

      await component.alternarBloqueoTotal(slot);

      expect(presenter.quitarRestriccion).toHaveBeenCalledWith('restriccion-total');
    });
  });

  describe('agregar', () => {
    it('dada una seleccion vacia, cuando llamo a agregar, no deberia pasar nada', () => {
      whenMonto();

      component.agregar('ts-001', '');

      expect(presenter.agregarRestriccion).not.toHaveBeenCalled();
    });

    it('dada la seleccion ALL:all, cuando llamo a agregar, deberia agregar un bloqueo TOTAL', () => {
      whenMonto();

      component.agregar('ts-001', 'ALL:all');

      expect(presenter.agregarRestriccion).toHaveBeenCalledWith('ts-001', 'TOTAL');
    });

    it('dada la seleccion CAT:x, cuando llamo a agregar, deberia agregar una restriccion CATEGORIA', () => {
      whenMonto();

      component.agregar('ts-001', 'CAT:cat-bebidas');

      expect(presenter.agregarRestriccion).toHaveBeenCalledWith('ts-001', 'CATEGORIA', 'cat-bebidas');
    });

    it('dada la seleccion SAL:x, cuando llamo a agregar, deberia agregar una restriccion SALUD', () => {
      whenMonto();

      component.agregar('ts-001', 'SAL:salud-tacc');

      expect(presenter.agregarRestriccion).toHaveBeenCalledWith('ts-001', 'SALUD', 'salud-tacc');
    });
  });

  describe('activeItem con id no matcheado', () => {
    it('dado un selectedFranjaId que no coincide con ninguna franja, activeItem deberia devolver la primera', () => {
      presenter.franjasConRestricciones.set([
        FranjaConRestriccionesMother.crear({ franja: TimeSlotMother.crear() }),
        FranjaConRestriccionesMother.crear({ franja: TimeSlotMother.crearSegundo() }),
      ]);
      whenMonto();
      component['selectedFranjaId'].set('id-inexistente');

      expect(component['activeItem']()?.franja.id).toBe('ts-001');
    });

    it('dado sin franjas cargadas, activeItem deberia ser undefined', () => {
      whenMonto();

      expect(component['activeItem']()).toBeUndefined();
    });
  });

  describe('currentIndex con selectedFranjaId vacio', () => {
    it('dado selectedFranjaId vacio y franjas cargadas, currentIndex deberia caer en la primera franja', () => {
      presenter.franjasConRestricciones.set([
        FranjaConRestriccionesMother.crear({ franja: TimeSlotMother.crear() }),
        FranjaConRestriccionesMother.crear({ franja: TimeSlotMother.crearSegundo() }),
      ]);
      whenMonto();
      component['selectedFranjaId'].set('');

      expect(component.currentIndex()).toBe(0);
    });
  });

  describe('quitarBloqueoTotal', () => {
    it('dado un item sin restriccion total, quitarBloqueoTotal no deberia llamar al presenter', () => {
      whenMonto();
      const slot = FranjaConRestriccionesMother.crear({ tieneBloqueoTotal: false, restricciones: [] });

      (component as unknown as { quitarBloqueoTotal(s: FranjaConRestricciones): void }).quitarBloqueoTotal(slot);

      expect(presenter.quitarRestriccion).not.toHaveBeenCalled();
    });

    it('dado un item con restriccion total, quitarBloqueoTotal deberia llamar al presenter con ese id', () => {
      whenMonto();
      const slot = FranjaConRestriccionesMother.crear({
        tieneBloqueoTotal: true,
        restricciones: [RestriccionHorariaMother.crearBloqueoTotal({ id: 'restriccion-total' })],
      });

      (component as unknown as { quitarBloqueoTotal(s: FranjaConRestricciones): void }).quitarBloqueoTotal(slot);

      expect(presenter.quitarRestriccion).toHaveBeenCalledWith('restriccion-total');
    });
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
