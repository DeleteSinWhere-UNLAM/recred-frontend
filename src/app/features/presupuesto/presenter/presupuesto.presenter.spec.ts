import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CategoriaProducto } from '../../buffet/models/producto.model';
import { PrediccionGasto, Presupuesto } from '../models/presupuesto.model';
import { PresupuestoService } from '../services/presupuesto.service';
import { PresupuestoPresenter } from './presupuesto.presenter';

describe('PresupuestoPresenter', () => {
  const alumnoMock: Alumno = {
    id: 'alumno-1',
    nombre: 'Mateo',
    apellido: 'López',
    grado: '5to A',
    colegioId: 'colegio-1',
    saldo: 0,
  };

  const categoriasMock: CategoriaProducto[] = [
    { id: 'cat-bebidas', descripcion: 'Bebidas e Infusiones' },
    { id: 'cat-lacteos', descripcion: 'Lácteos' },
    { id: 'cat-viandas', descripcion: 'Viandas y Platos' },
  ];

  const prediccionMock: PrediccionGasto = {
    alumnoId: 'alumno-1',
    periodo: 'MENSUAL',
    gastoActual: 1500,
    gastoPredicho: 3000,
    promedioGastoDiario: 100,
    montoLimite: 5000,
    porcentajePresupuesto: 60,
    confianza: 0.8,
    diasRestantes: 10,
    categoriasMasConsumidas: [],
    resumenIa: '',
    alertas: [],
    recomendaciones: [],
  };

  let presenter: PresupuestoPresenter;
  let alumnosService: jasmine.SpyObj<AlumnosService>;
  let presupuestoService: jasmine.SpyObj<PresupuestoService>;
  let toastService: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    alumnosService = jasmine.createSpyObj<AlumnosService>('AlumnosService', [
      'asegurarCargados',
      'getAlumnoById',
    ]);
    presupuestoService = jasmine.createSpyObj<PresupuestoService>(
      'PresupuestoService',
      [
        'getPresupuesto',
        'getCategoriasDisponibles',
        'cargarPrediccion',
        'guardar',
      ],
    );
    toastService = jasmine.createSpyObj<ToastService>('ToastService', [
      'mostrar',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    alumnosService.asegurarCargados.and.resolveTo([alumnoMock]);
    alumnosService.getAlumnoById.and.returnValue(alumnoMock);
    presupuestoService.getCategoriasDisponibles.and.resolveTo(categoriasMock);
    presupuestoService.getPresupuesto.and.resolveTo(undefined);
    presupuestoService.cargarPrediccion.and.resolveTo(prediccionMock);

    TestBed.configureTestingModule({
      providers: [
        PresupuestoPresenter,
        { provide: AlumnosService, useValue: alumnosService },
        { provide: PresupuestoService, useValue: presupuestoService },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
      ],
    });

    presenter = TestBed.inject(PresupuestoPresenter);
  });

  describe('init', () => {
    it('redirige a /tutor si el alumno no existe', async () => {
      alumnosService.getAlumnoById.and.returnValue(undefined);

      await presenter.init('inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
      expect(presupuestoService.getCategoriasDisponibles).not.toHaveBeenCalled();
      expect(presupuestoService.getPresupuesto).not.toHaveBeenCalled();
    });

    it('carga alumno, categorías y predicción cuando no hay presupuesto previo', async () => {
      await presenter.init('alumno-1');

      expect(presenter.alumno()).toEqual(alumnoMock);
      expect(presenter.nombreCompleto()).toBe('Mateo López');
      expect(presenter.iniciales()).toBe('ML');
      expect(presenter.grado()).toBe('5to A');
      expect(presenter.categoriasDisponibles()).toEqual(categoriasMock);
      expect(presenter.reglas().length).toBe(0);
      expect(presenter.prediccion()).toEqual(prediccionMock);
      expect(presenter.cargando()).toBeFalse();
    });

    it('devuelve strings vacios en getters si no hay alumno', async () => {
      alumnosService.getAlumnoById.and.returnValue(undefined);
      expect(presenter.nombreCompleto()).toBe('');
      expect(presenter.iniciales()).toBe('');
      expect(presenter.grado()).toBe('');
      expect(presenter.urlFotoPerfil()).toBeNull();
    });

    it('maneja iniciales cuando el nombre o apellido estan vacios', async () => {
      alumnosService.getAlumnoById.and.returnValue({ ...alumnoMock, nombre: '', apellido: '' });
      await presenter.init('alumno-1');
      expect(presenter.iniciales()).toBe('');
    });

    it('reemplaza el presupuesto por el del back si existe', async () => {
      const presupuestoBack: Presupuesto = {
        id: 'pres-1',
        alumnoId: 'alumno-1',
        montoLimiteGeneral: 10000,
        periodo: 'SEMANAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [
          {
            id: 'r-1',
            categoriaId: 'cat-bebidas',
            descripcionCategoria: 'Bebidas e Infusiones',
            porcentajeLimite: 40,
            montoLimiteCalculado: 4000,
            activo: true,
          },
        ],
      };
      presupuestoService.getPresupuesto.and.resolveTo(presupuestoBack);

      await presenter.init('alumno-1');

      expect(presenter.presupuesto().id).toBe('pres-1');
      expect(presenter.presupuesto().montoLimiteGeneral).toBe(10000);
      expect(presenter.presupuesto().periodo).toBe('SEMANAL');
      expect(presenter.reglas().length).toBe(1);
      expect(presupuestoService.cargarPrediccion).toHaveBeenCalledWith(
        'alumno-1',
        'SEMANAL',
      );
    });

    it('muestra un toast de error si falla la carga', async () => {
      presupuestoService.getCategoriasDisponibles.and.rejectWith(
        new Error('boom'),
      );

      await presenter.init('alumno-1');

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'No pudimos cargar el presupuesto del alumno.',
        'error',
      );
      expect(presenter.cargando()).toBeFalse();
    });
  });

  describe('setters', () => {
    it('setMontoGeneral guarda 0 si recibe un valor inválido', () => {
      presenter.setMontoGeneral(Number.NaN);
      expect(presenter.presupuesto().montoLimiteGeneral).toBe(0);

      presenter.setMontoGeneral(-50);
      expect(presenter.presupuesto().montoLimiteGeneral).toBe(0);
    });

    it('setMontoGeneral recalcula los montos de las reglas', async () => {
      await presenter.init('alumno-1');
      presenter.agregarReglaCategoria('cat-bebidas');
      const reglaId = presenter.reglas()[0].id;
      presenter.setPorcentajeRegla(reglaId, 40);

      presenter.setMontoGeneral(1000);

      expect(presenter.presupuesto().montoLimiteGeneral).toBe(1000);
      expect(presenter.reglas()[0].montoLimiteCalculado).toBe(400);
    });

    it('setPeriodo y setFechaInicio actualizan el presupuesto', () => {
      presenter.setPeriodo('SEMANAL');
      expect(presenter.presupuesto().periodo).toBe('SEMANAL');

      presenter.setFechaInicio('2026-07-01');
      expect(presenter.presupuesto().fechaInicio).toBe('2026-07-01');
    });
  });

  describe('reglas por categoría', () => {
    beforeEach(async () => {
      await presenter.init('alumno-1');
    });

    it('agregarReglaCategoria crea una regla nueva con 0%', () => {
      presenter.agregarReglaCategoria('cat-bebidas');

      expect(presenter.reglas().length).toBe(1);
      expect(presenter.reglas()[0].categoriaId).toBe('cat-bebidas');
      expect(presenter.reglas()[0].porcentajeLimite).toBe(0);
      expect(presenter.reglas()[0].activo).toBeTrue();
    });

    it('agregarReglaCategoria ignora categoría inexistente', () => {
      presenter.agregarReglaCategoria('cat-inexistente');
      expect(presenter.reglas().length).toBe(0);
    });

    it('agregarReglaCategoria no duplica una regla existente', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-bebidas');
      expect(presenter.reglas().length).toBe(1);
    });

    it('categoriasUsables excluye las ya usadas', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      expect(presenter.categoriasUsables().map((c) => c.id)).toEqual([
        'cat-lacteos',
        'cat-viandas',
      ]);
    });

    it('puedeAgregarRegla es false cuando se usaron todas las categorías', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-lacteos');
      presenter.agregarReglaCategoria('cat-viandas');
      expect(presenter.puedeAgregarRegla()).toBeFalse();
    });

    it('eliminarRegla saca la regla de la lista', () => {
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
      await presenter.init('alumno-1');
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-lacteos');
      reglaA = presenter.reglas()[0].id;
      reglaB = presenter.reglas()[1].id;
    });

    it('clampea valores negativos a 0', () => {
      presenter.setPorcentajeRegla(reglaA, -20);
      expect(presenter.reglas()[0].porcentajeLimite).toBe(0);
    });

    it('clampea por encima de 100 cuando no hay otras reglas con peso', () => {
      presenter.setPorcentajeRegla(reglaA, 150);
      expect(presenter.reglas()[0].porcentajeLimite).toBe(100);
    });

    it('clampea al disponible (100 − suma de las otras)', () => {
      presenter.setPorcentajeRegla(reglaA, 70);
      presenter.setPorcentajeRegla(reglaB, 80);

      expect(presenter.reglas()[0].porcentajeLimite).toBe(70);
      expect(presenter.reglas()[1].porcentajeLimite).toBe(30);
      expect(presenter.totalPorcentaje()).toBe(100);
    });

    it('clampea NaN a 0', () => {
      presenter.setPorcentajeRegla(reglaA, Number.NaN);
      expect(presenter.reglas()[0].porcentajeLimite).toBe(0);
    });
  });

  describe('signals derivadas', () => {
    beforeEach(async () => {
      await presenter.init('alumno-1');
    });

    it('totalPorcentaje suma sólo las reglas activas', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      presenter.agregarReglaCategoria('cat-lacteos');
      const a = presenter.reglas()[0].id;
      const b = presenter.reglas()[1].id;
      presenter.setPorcentajeRegla(a, 30);
      presenter.setPorcentajeRegla(b, 45);

      expect(presenter.totalPorcentaje()).toBe(75);
    });

    it('porcentajeValido es true cuando el total ≤ 100', () => {
      expect(presenter.porcentajeValido()).toBeTrue();
    });

    it('topeCompletado es true sólo cuando el total = 100', () => {
      presenter.agregarReglaCategoria('cat-bebidas');
      const a = presenter.reglas()[0].id;
      presenter.setPorcentajeRegla(a, 100);
      expect(presenter.topeCompletado()).toBeTrue();

      presenter.setPorcentajeRegla(a, 90);
      expect(presenter.topeCompletado()).toBeFalse();
    });

    it('nivelAlerta refleja el porcentaje de la predicción', async () => {
      expect(presenter.nivelAlerta()).toBe('ok');

      presupuestoService.cargarPrediccion.and.resolveTo({
        ...prediccionMock,
        porcentajePresupuesto: 80,
      });
      await presenter.init('alumno-1');
      expect(presenter.nivelAlerta()).toBe('warning');

      presupuestoService.cargarPrediccion.and.resolveTo({
        ...prediccionMock,
        porcentajePresupuesto: 110,
      });
      await presenter.init('alumno-1');
      expect(presenter.nivelAlerta()).toBe('excedido');
    });
  });

  describe('guardar', () => {
    beforeEach(async () => {
      await presenter.init('alumno-1');
    });

    it('no hace nada si esta cargando o guardando', async () => {
      (presenter as any).guardandoState.set(true);
      await presenter.guardar();
      expect(presupuestoService.guardar).not.toHaveBeenCalled();

      (presenter as any).guardandoState.set(false);
      (presenter as any).cargandoState.set(true);
      await presenter.guardar();
      expect(presupuestoService.guardar).not.toHaveBeenCalled();
      
      (presenter as any).cargandoState.set(false);
    });

    it('no llama al service si el porcentaje no es válido', async () => {
      const presupuestoForzado: Presupuesto = {
        ...presenter.presupuesto(),
        reglasCategoria: [
          {
            id: 'r-x',
            categoriaId: 'cat-bebidas',
            descripcionCategoria: 'Bebidas',
            porcentajeLimite: 120,
            montoLimiteCalculado: 0,
            activo: true,
          },
        ],
      };
      presupuestoService.getPresupuesto.and.resolveTo(presupuestoForzado);
      await presenter.init('alumno-1');

      await presenter.guardar();

      expect(presupuestoService.guardar).not.toHaveBeenCalled();
      expect(toastService.mostrar).toHaveBeenCalledWith(
        'La suma de porcentajes no puede superar 100%.',
        'error',
      );
    });

    it('guarda exitosamente y muestra un toast de success', async () => {
      const guardado: Presupuesto = {
        ...presenter.presupuesto(),
        id: 'pres-nuevo',
      };
      presupuestoService.guardar.and.resolveTo(guardado);

      await presenter.guardar();

      expect(presupuestoService.guardar).toHaveBeenCalled();
      expect(presenter.presupuesto().id).toBe('pres-nuevo');
      expect(toastService.mostrar).toHaveBeenCalledWith(
        'Presupuesto guardado.',
        'success',
      );
      expect(presenter.guardando()).toBeFalse();
    });

    it('muestra un toast de error si el guardar falla', async () => {
      presupuestoService.guardar.and.rejectWith(new Error('boom'));

      await presenter.guardar();

      expect(toastService.mostrar).toHaveBeenCalledWith(
        'No pudimos guardar el presupuesto. Probá de nuevo.',
        'error',
      );
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
