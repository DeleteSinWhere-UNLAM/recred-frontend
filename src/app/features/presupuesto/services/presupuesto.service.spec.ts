import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Perfil } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Presupuesto } from '../models/presupuesto.model';
import { PresupuestoService } from './presupuesto.service';

describe('PresupuestoService', () => {
  const apiBase = environment.apiUrl;
  const iaBase = `${apiBase}/ia`;

  const perfilMock: Perfil = {
    id: 'tutor-1',
    email: 'tutor@example.com',
    nombre: 'Tutor',
    apellido: 'García',
    rol: 'PADRE',
  };

  let service: PresupuestoService;
  let httpMock: HttpTestingController;
  let perfilService: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    perfilService = jasmine.createSpyObj<PerfilService>('PerfilService', [
      'getPerfil',
    ]);
    perfilService.getPerfil.and.returnValue(perfilMock);

    TestBed.configureTestingModule({
      providers: [
        PresupuestoService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: perfilService },
      ],
    });

    service = TestBed.inject(PresupuestoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPresupuesto', () => {
    it('GET /budgets/student/{id}/active y mapea la respuesta', async () => {
      const promesa = service.getPresupuesto('alumno-42');
      const req = httpMock.expectOne(
        `${apiBase}/budgets/student/alumno-42/active`,
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        id: 'pres-1',
        alumnoId: 'alumno-42',
        montoLimiteGeneral: 5000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [
          {
            id: 'r-1',
            categoria: { id: 'cat-bebidas', descripcion: 'Bebidas' },
            porcentajeLimite: 40,
            montoLimiteCalculado: 0,
            activo: true,
          },
        ],
      });

      const resultado = (await promesa) as Presupuesto;
      expect(resultado.id).toBe('pres-1');
      expect(resultado.reglasCategoria.length).toBe(1);
      expect(resultado.reglasCategoria[0].categoriaId).toBe('cat-bebidas');
      expect(resultado.reglasCategoria[0].descripcionCategoria).toBe('Bebidas');
      expect(resultado.reglasCategoria[0].montoLimiteCalculado).toBe(2000);
    });

    it('devuelve undefined cuando el back responde 404', async () => {
      const promesa = service.getPresupuesto('alumno-x');
      const req = httpMock.expectOne(
        `${apiBase}/budgets/student/alumno-x/active`,
      );
      req.flush('not found', { status: 404, statusText: 'Not Found' });

      await expectAsync(promesa).toBeResolvedTo(undefined);
    });

    it('rechaza cuando el back responde otro error', async () => {
      const promesa = service.getPresupuesto('alumno-x');
      const req = httpMock.expectOne(
        `${apiBase}/budgets/student/alumno-x/active`,
      );
      req.flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });

    it('encodea correctamente el alumnoId con caracteres especiales', async () => {
      const promesa = service.getPresupuesto('id con espacio');
      const req = httpMock.expectOne(
        `${apiBase}/budgets/student/id%20con%20espacio/active`,
      );
      req.flush(null);
      await expectAsync(promesa).toBeResolvedTo(undefined);
    });
  });

  describe('getCategoriasDisponibles', () => {
    it('GET /categories y filtra inactivas', async () => {
      const promesa = service.getCategoriasDisponibles();
      const req = httpMock.expectOne(`${apiBase}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: 'cat-1', descripcion: 'Bebidas', activo: true },
        { id: 'cat-2', descripcion: 'Lácteos' },
        { id: 'cat-3', descripcion: 'Obsoleta', activo: false },
      ]);

      const resultado = await promesa;
      expect(resultado).toEqual([
        { id: 'cat-1', descripcion: 'Bebidas' },
        { id: 'cat-2', descripcion: 'Lácteos' },
      ]);
    });
  });

  describe('getPrediccion', () => {
    it('siempre retorna undefined (stub temporal)', () => {
      expect(service.getPrediccion('alumno-1')).toBeUndefined();
    });
  });

  describe('cargarPrediccion', () => {
    it('GET /ia/alumnos/{id}/prediccion-gasto con periodo y mapea la IA', async () => {
      const promesa = service.cargarPrediccion('alumno-1', 'MENSUAL');
      const req = httpMock.expectOne(
        (r) =>
          r.url ===
            `${iaBase}/alumnos/alumno-1/prediccion-gasto` &&
          r.params.get('periodo') === 'MENSUAL',
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        alumnoId: 'alumno-1',
        periodo: 'MENSUAL',
        gastoActual: 1500,
        gastoPredicho: 3000,
        promedioGastoDiario: 100,
        montoLimite: 5000,
        porcentajePresupuesto: 60,
        confianza: 0.8,
        diasRestantes: 10,
        categoriasMasConsumidas: [
          { descripcion: 'Bebidas', montoTotal: 800 },
        ],
        analisisIa: {
          resumen: 'Va bien',
          alertas: ['Faltan 10 días'],
          recomendaciones: ['Reducir bebidas'],
        },
      });

      const resultado = await promesa;
      expect(resultado?.resumenIa).toBe('Va bien');
      expect(resultado?.alertas).toEqual(['Faltan 10 días']);
      expect(resultado?.recomendaciones).toEqual(['Reducir bebidas']);
      expect(resultado?.categoriasMasConsumidas).toEqual([
        { descripcion: 'Bebidas', montoTotal: 800 },
      ]);
    });

    it('devuelve undefined cuando el back responde 404', async () => {
      const promesa = service.cargarPrediccion('alumno-1', 'MENSUAL');
      const req = httpMock.expectOne(
        (r) =>
          r.url === `${iaBase}/alumnos/alumno-1/prediccion-gasto`,
      );
      req.flush('not found', { status: 404, statusText: 'Not Found' });

      await expectAsync(promesa).toBeResolvedTo(undefined);
    });

    it('mapea valores por defecto cuando no viene analisisIa', async () => {
      const promesa = service.cargarPrediccion('alumno-1', 'SEMANAL');
      const req = httpMock.expectOne(
        (r) => r.url === `${iaBase}/alumnos/alumno-1/prediccion-gasto`,
      );
      req.flush({
        alumnoId: 'alumno-1',
        periodo: 'SEMANAL',
        gastoActual: 0,
        gastoPredicho: 0,
        promedioGastoDiario: 0,
        montoLimite: 0,
        porcentajePresupuesto: 0,
        confianza: 0,
        diasRestantes: 0,
      });

      const resultado = await promesa;
      expect(resultado?.resumenIa).toBe('');
      expect(resultado?.alertas).toEqual([]);
      expect(resultado?.recomendaciones).toEqual([]);
      expect(resultado?.categoriasMasConsumidas).toEqual([]);
    });
  });

  describe('checkBudgetDates', () => {
    it('POST /budgets/student/{id}/check-dates y devuelve validationResults', async () => {
      const promesa = service.checkBudgetDates('alumno-1', ['2026-06-01'], [{ productId: 'prod-1', quantity: 2 }]);
      const req = httpMock.expectOne(`${apiBase}/budgets/student/alumno-1/check-dates`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ dates: ['2026-06-01'], items: [{ productId: 'prod-1', quantity: 2 }] });
      req.flush({
        validationResults: [
          { date: '2026-06-01', blocked: false, reason: null }
        ]
      });

      const resultado = await promesa;
      expect(resultado.length).toBe(1);
      expect(resultado[0].blocked).toBeFalse();
    });

    it('devuelve array vacio si response es null (ej validacion de safety bounds)', async () => {
      const promesa = service.checkBudgetDates('alumno-1', [], []);
      const req = httpMock.expectOne(`${apiBase}/budgets/student/alumno-1/check-dates`);
      req.flush(null);

      const resultado = await promesa;
      expect(resultado).toEqual([]);
    });
  });

  describe('guardar', () => {
    const presupuestoNuevo: Presupuesto = {
      id: '',
      alumnoId: 'alumno-1',
      montoLimiteGeneral: 4000,
      periodo: 'MENSUAL',
      fechaInicio: '2026-06-01',
      activo: false,
      reglasCategoria: [
        {
          id: 'r-1',
          categoriaId: 'cat-bebidas',
          descripcionCategoria: 'Bebidas',
          porcentajeLimite: 50,
          montoLimiteCalculado: 2000,
          activo: true,
        },
      ],
    };

    it('POST /budgets cuando el presupuesto no tiene id', async () => {
      const promesa = service.guardar(presupuestoNuevo);
      const req = httpMock.expectOne(`${apiBase}/budgets`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        studentId: 'alumno-1',
        creadorId: 'tutor-1',
        limitAmount: 4000,
        period: 'MENSUAL',
        startDate: '2026-06-01',
        categoryRules: [{ categoryId: 'cat-bebidas', porcentajeLimite: 50 }],
      });
      req.flush({
        id: 'pres-nuevo',
        alumnoId: 'alumno-1',
        montoLimiteGeneral: 4000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [],
      });

      const resultado = await promesa;
      expect(resultado.id).toBe('pres-nuevo');
    });

    it('PUT /budgets/{id} cuando el presupuesto tiene id', async () => {
      const presupuestoExistente = { ...presupuestoNuevo, id: 'pres-1' };
      const promesa = service.guardar(presupuestoExistente);
      const req = httpMock.expectOne(`${apiBase}/budgets/pres-1`);
      expect(req.request.method).toBe('PUT');
      req.flush({
        id: 'pres-1',
        alumnoId: 'alumno-1',
        montoLimiteGeneral: 4000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [],
      });

      await expectAsync(promesa).toBeResolved();
    });

    it('descarta reglas inactivas al construir el comando', async () => {
      const presupuestoConInactivas: Presupuesto = {
        ...presupuestoNuevo,
        reglasCategoria: [
          ...presupuestoNuevo.reglasCategoria,
          {
            id: 'r-2',
            categoriaId: 'cat-lacteos',
            descripcionCategoria: 'Lácteos',
            porcentajeLimite: 30,
            montoLimiteCalculado: 1200,
            activo: false,
          },
        ],
      };
      const promesa = service.guardar(presupuestoConInactivas);
      const req = httpMock.expectOne(`${apiBase}/budgets`);
      expect(req.request.body.categoryRules.length).toBe(1);
      expect(req.request.body.categoryRules[0].categoryId).toBe('cat-bebidas');
      req.flush({
        id: 'pres-1',
        alumnoId: 'alumno-1',
        montoLimiteGeneral: 4000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [],
      });
      await promesa;
    });

    it('tira error si no hay perfil logueado', async () => {
      perfilService.getPerfil.and.returnValue(null);

      await expectAsync(service.guardar(presupuestoNuevo)).toBeRejectedWithError(
        'No hay un usuario logueado para crear el presupuesto.',
      );
    });
  });
});
