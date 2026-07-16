import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PresupuestoService } from '../services/presupuesto.service';
import {
  ALUMNO_ID_TEST,
  CategoriaProductoMother,
  PresupuestoMother,
  ReglaCategoriaMother,
} from '../presupuesto.mother';
import { PresupuestoPresenter } from './presupuesto.presenter';

describe('PresupuestoPresenter', () => {
  let presenter: PresupuestoPresenter;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados', 'getAlumnoById']);
    servicioPresupuesto = jasmine.createSpyObj('PresupuestoService', [
      'getPresupuesto',
      'getCategoriasDisponibles',
      'guardar',
    ]);
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);

    const alumnoTest = AlumnoMother.crear({
      id: ALUMNO_ID_TEST,
      nombre: 'Mateo',
      apellido: 'López',
      grado: '5to A',
    });
    servicioAlumnos.asegurarCargados.and.resolveTo([alumnoTest]);
    servicioAlumnos.getAlumnoById.and.returnValue(alumnoTest);
    servicioPresupuesto.getCategoriasDisponibles.and.resolveTo(CategoriaProductoMother.crearVarias());
    servicioPresupuesto.getPresupuesto.and.resolveTo(undefined);

    TestBed.configureTestingModule({
      providers: [
        PresupuestoPresenter,
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(PresupuestoPresenter);
  });

  describe('init', () => {
    it('dado un alumno inexistente, cuando inicializo, deberia redirigir a /tutor sin llamar al service', async () => {
      givenAlumnoInexistente();

      await presenter.init('inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(servicioPresupuesto.getCategoriasDisponibles).not.toHaveBeenCalled();
      expect(servicioPresupuesto.getPresupuesto).not.toHaveBeenCalled();
    });

    it('dado un alumno existente sin presupuesto previo, cuando inicializo, deberia cargar categorias y presupuesto por defecto', async () => {
      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.alumno()?.id).toBe(ALUMNO_ID_TEST);
      expect(presenter.nombreCompleto()).toBe('Mateo');
      expect(presenter.iniciales()).toBe('M');
      expect(presenter.grado()).toBe('5to A');
      expect(presenter.categoriasDisponibles().length).toBe(3);
      expect(presenter.reglas().length).toBe(0);
      expect(presenter.cargando()).toBeFalse();
    });

    it('dado un presupuesto del back, cuando inicializo, deberia reemplazar el presupuesto por defecto', async () => {
      givenPresupuestoDelBack({ ...PresupuestoMother.crearConMultiplesReglas(), periodo: 'SEMANAL' });

      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.presupuesto().montoLimiteGeneral).toBe(10000);
      expect(presenter.reglas().length).toBe(2);
    });

    it('dado que la carga falla, cuando inicializo, deberia mostrar toast de error', async () => {
      spyOn(console, 'warn');
      givenGetCategoriasFalla();

      await presenter.init(ALUMNO_ID_TEST);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No pudimos cargar el presupuesto del alumno.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('setters basicos', () => {
    it('dado un monto invalido (NaN o negativo), cuando lo seteo, deberia clampearlo a 0', () => {
      presenter.setMontoGeneral(Number.NaN);
      expect(presenter.presupuesto().montoLimiteGeneral).toBe(0);

      presenter.setMontoGeneral(-50);
      expect(presenter.presupuesto().montoLimiteGeneral).toBe(0);
    });

    it('dado un nuevo monto general, cuando lo seteo, deberia recalcular los montos de cada regla', async () => {
      await presenter.init(ALUMNO_ID_TEST);
      presenter.agregarReglaCategoria('cat-bebidas');
      const reglaId = presenter.reglas()[0].id;
      presenter.setPorcentajeRegla(reglaId, 40);

      presenter.setMontoGeneral(1000);

      expect(presenter.presupuesto().montoLimiteGeneral).toBe(1000);
      expect(presenter.reglas()[0].montoLimiteCalculado).toBe(400);
    });

    it('dado el presenter, cuando llamo setPeriodo y setFechaInicio, deberia actualizar el presupuesto', () => {
      presenter.setPeriodo('SEMANAL');
      expect(presenter.presupuesto().periodo).toBe('SEMANAL');

      presenter.setFechaInicio('2026-07-01');
      expect(presenter.presupuesto().fechaInicio).toBe('2026-07-01');
    });
  });

  describe('reglas por categoria', () => {
    beforeEach(async () => {
      await presenter.init(ALUMNO_ID_TEST);
    });

    it('dado una categoria disponible, cuando agrego una regla, deberia crearla con 0%', () => {
      presenter.agregarReglaCategoria('cat-bebidas');

      expect(presenter.reglas().length).toBe(1);
      expect(presenter.reglas()[0].categoriaId).toBe('cat-bebidas');
      expect(presenter.reglas()[0].porcentajeLimite).toBe(0);
      expect(presenter.reglas()[0].activo).toBeTrue();
    });

    it('dado una categoria inexistente, cuando agrego una regla, no deberia crear nada', () => {
      presenter.agregarReglaCategoria('cat-inexistente');

      expect(presenter.reglas().length).toBe(0);
    });

    it('dado una regla ya creada, cuando agrego la misma, no deberia duplicarla', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-bebidas');

      expect(presenter.reglas().length).toBe(1);
    });

    it('dado una regla creada, cuando consulto categoriasUsables, deberia excluirla del listado disponible', () => {
      presenter.agregarReglaCategoria('cat-bebidas');

      expect(presenter.categoriasUsables().map((c) => c.id)).toEqual(['cat-lacteos', 'cat-viandas']);
    });

    it('dado que se usaron todas las categorias, cuando consulto puedeAgregarRegla, deberia ser false', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-lacteos');
      presenter.agregarReglaCategoria('cat-viandas');

      expect(presenter.puedeAgregarRegla()).toBeFalse();
    });

    it('dado una regla existente, cuando la elimino, deberia sacarla de la lista', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      const reglaId = presenter.reglas()[0].id;

      presenter.eliminarRegla(reglaId);

      expect(presenter.reglas().length).toBe(0);
    });
  });

  describe('setPorcentajeRegla (clamp)', () => {
    let reglaA: string;
    let reglaB: string;

    beforeEach(async () => {
      await presenter.init(ALUMNO_ID_TEST);
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-lacteos');
      reglaA = presenter.reglas()[0].id;
      reglaB = presenter.reglas()[1].id;
    });

    it('dado un porcentaje negativo, cuando lo seteo, deberia clampearlo a 0', () => {
      presenter.setPorcentajeRegla(reglaA, -20);

      expect(presenter.reglas()[0].porcentajeLimite).toBe(0);
    });

    it('dado un porcentaje mayor a 100 sin otras reglas, cuando lo seteo, deberia clampearlo a 100', () => {
      presenter.setPorcentajeRegla(reglaA, 150);

      expect(presenter.reglas()[0].porcentajeLimite).toBe(100);
    });

    it('dado A=70 y luego intento setear B=80, cuando lo hago, B deberia clampearse a 30 para no superar 100 en total', () => {
      presenter.setPorcentajeRegla(reglaA, 70);
      presenter.setPorcentajeRegla(reglaB, 80);

      expect(presenter.reglas()[0].porcentajeLimite).toBe(70);
      expect(presenter.reglas()[1].porcentajeLimite).toBe(30);
      expect(presenter.totalPorcentaje()).toBe(100);
    });

    it('dado un porcentaje NaN, cuando lo seteo, deberia clampearlo a 0', () => {
      presenter.setPorcentajeRegla(reglaA, Number.NaN);

      expect(presenter.reglas()[0].porcentajeLimite).toBe(0);
    });
  });

  describe('signals derivadas', () => {
    beforeEach(async () => {
      await presenter.init(ALUMNO_ID_TEST);
    });

    it('dado reglas activas con 30% y 45%, cuando pido totalPorcentaje, deberia ser 75', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-lacteos');
      const a = presenter.reglas()[0].id;
      const b = presenter.reglas()[1].id;
      presenter.setPorcentajeRegla(a, 30);
      presenter.setPorcentajeRegla(b, 45);

      expect(presenter.totalPorcentaje()).toBe(75);
    });

    it('dado total <= 100, cuando consulto porcentajeValido, deberia ser true', () => {
      expect(presenter.porcentajeValido()).toBeTrue();
    });

    it('dado total = 100, cuando consulto topeCompletado, deberia ser true (y false cuando bajo a 90)', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      const a = presenter.reglas()[0].id;
      presenter.setPorcentajeRegla(a, 100);
      expect(presenter.topeCompletado()).toBeTrue();

      presenter.setPorcentajeRegla(a, 90);
      expect(presenter.topeCompletado()).toBeFalse();
    });

  });

  describe('guardar', () => {
    beforeEach(async () => {
      await presenter.init(ALUMNO_ID_TEST);
    });

    it('dado un porcentaje invalido (>100), cuando guardo, no deberia llamar al service y deberia mostrar toast', async () => {
      givenPresupuestoDelBack(
        PresupuestoMother.crear({
          reglasCategoria: [ReglaCategoriaMother.crear({ porcentajeLimite: 120 })],
        }),
      );
      await presenter.init(ALUMNO_ID_TEST);

      await presenter.guardar();

      expect(servicioPresupuesto.guardar).not.toHaveBeenCalled();
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'La suma de porcentajes no puede superar 100%.',
        'error',
      );
    });

    it('dado un presupuesto valido, cuando guardo, deberia llamar al service y mostrar toast success', async () => {
      servicioPresupuesto.guardar.and.resolveTo(PresupuestoMother.crear({ id: 'pres-nuevo' }));

      await presenter.guardar();

      expect(servicioPresupuesto.guardar).toHaveBeenCalled();
      expect(presenter.presupuesto().id).toBe('pres-nuevo');
      expect(servicioToast.mostrar).toHaveBeenCalledWith('Presupuesto guardado.', 'success');
      expect(presenter.guardando()).toBeFalse();
    });

    it('dado que el service falla, cuando guardo, deberia mostrar toast de error', async () => {
      spyOn(console, 'warn');
      servicioPresupuesto.guardar.and.rejectWith(new Error('boom'));

      await presenter.guardar();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No pudimos guardar el presupuesto. Probá de nuevo.',
        'error',
      );
      expect(presenter.guardando()).toBeFalse();
    });
  });

  describe('volver', () => {
    it('dado el presenter, cuando llamo volver, deberia navegar a /tutor', () => {
      presenter.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  describe('urlFotoPerfil', () => {
    it('dado un alumno con urlFotoPerfil, deberia devolver esa url', async () => {
      const alumnoConFoto = AlumnoMother.crear({
        id: ALUMNO_ID_TEST,
        urlFotoPerfil: 'https://cdn/foto.png',
      });
      servicioAlumnos.getAlumnoById.and.returnValue(alumnoConFoto);

      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.urlFotoPerfil()).toBe('https://cdn/foto.png');
    });

    it('dado un alumno sin urlFotoPerfil, deberia devolver null', async () => {
      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.urlFotoPerfil()).toBeNull();
    });
  });

  describe('signals derivadas sin alumno', () => {
    it('dado el presenter recien creado sin alumno, cuando pido grado, deberia devolver string vacio', () => {
      expect(presenter.grado()).toBe('');
    });

    it('dado el presenter recien creado sin alumno, cuando pido iniciales, deberia devolver string vacio', () => {
      expect(presenter.iniciales()).toBe('');
    });

    it('dado un alumno con nombre y apellido vacios, cuando pido iniciales, deberia devolver string vacio', async () => {
      const alumnoSinNombre = AlumnoMother.crear({
        id: ALUMNO_ID_TEST,
        nombre: '',
        apellido: '',
      });
      servicioAlumnos.getAlumnoById.and.returnValue(alumnoSinNombre);

      await presenter.init(ALUMNO_ID_TEST);

      expect(presenter.iniciales()).toBe('');
    });
  });

  describe('guardar (early returns)', () => {
    it('dado que ya estoy guardando, cuando llamo guardar de nuevo, no deberia llamar al service', async () => {
      await presenter.init(ALUMNO_ID_TEST);
      const presupuestoResultado = PresupuestoMother.crear({ id: 'pres-1' });
      let resolverGuardar!: (v: typeof presupuestoResultado) => void;
      servicioPresupuesto.guardar.and.returnValue(
        new Promise<typeof presupuestoResultado>((resolve) => {
          resolverGuardar = resolve;
        }),
      );

      const primera = presenter.guardar();
      const segunda = presenter.guardar();
      resolverGuardar(presupuestoResultado);
      await Promise.all([primera, segunda]);

      expect(servicioPresupuesto.guardar).toHaveBeenCalledTimes(1);
    });

    it('dado que estoy cargando el init, cuando disparo guardar, no deberia llamar al service', async () => {
      const categorias = CategoriaProductoMother.crearVarias();
      let resolverInit!: (v: typeof categorias) => void;
      servicioPresupuesto.getCategoriasDisponibles.and.returnValue(
        new Promise<typeof categorias>((resolve) => {
          resolverInit = resolve;
        }),
      );

      const initEnCurso = presenter.init(ALUMNO_ID_TEST);
      const resultado = presenter.guardar();
      resolverInit(categorias);
      await Promise.all([initEnCurso, resultado]);

      expect(servicioPresupuesto.guardar).not.toHaveBeenCalled();
    });
  });

  function givenAlumnoInexistente(): void {
    servicioAlumnos.getAlumnoById.and.returnValue(undefined);
  }

  function givenPresupuestoDelBack(presupuesto: ReturnType<typeof PresupuestoMother.crear>): void {
    servicioPresupuesto.getPresupuesto.and.resolveTo(presupuesto);
  }

  function givenGetCategoriasFalla(): void {
    servicioPresupuesto.getCategoriasDisponibles.and.rejectWith(new Error('boom'));
  }
});
