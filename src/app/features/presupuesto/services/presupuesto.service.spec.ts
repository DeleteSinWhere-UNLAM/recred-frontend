import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { PerfilMother } from '../../../data-access/services/alumno.mother';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  ALUMNO_ID_TEST,
  PRESUPUESTO_ID_TEST,
  PresupuestoMother,
  ReglaCategoriaMother,
} from '../presupuesto.mother';
import { PresupuestoService } from './presupuesto.service';

describe('PresupuestoService', () => {
  const API = environment.apiUrl;
  const IA = `${API}/ia`;

  let service: PresupuestoService;
  let httpMock: HttpTestingController;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;

  beforeEach(() => {
    servicioPerfil = jasmine.createSpyObj<PerfilService>('PerfilService', ['getPerfil']);
    servicioPerfil.getPerfil.and.returnValue(
      PerfilMother.crear({ id: 'tutor-1', rol: 'PADRE' }),
    );

    TestBed.configureTestingModule({
      providers: [
        PresupuestoService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PerfilService, useValue: servicioPerfil },
      ],
    });

    service = TestBed.inject(PresupuestoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getPresupuesto', () => {
    it('dado un alumnoId, cuando pido el presupuesto activo, deberia hacer GET /budgets/student/{id}/active y mapear la respuesta', async () => {
      const promesa = service.getPresupuesto('alumno-42');
      const req = httpMock.expectOne(`${API}/budgets/student/alumno-42/active`);
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

      const resultado = await promesa;
      expect(resultado?.id).toBe('pres-1');
      expect(resultado?.reglasCategoria[0].categoriaId).toBe('cat-bebidas');
      expect(resultado?.reglasCategoria[0].descripcionCategoria).toBe('Bebidas');
      expect(resultado?.reglasCategoria[0].montoLimiteCalculado).toBe(2000);
    });

    it('dado que el back responde 404, cuando pido el presupuesto, deberia resolver con undefined', async () => {
      const promesa = service.getPresupuesto('alumno-x');
      httpMock
        .expectOne(`${API}/budgets/student/alumno-x/active`)
        .flush('not found', { status: 404, statusText: 'Not Found' });

      await expectAsync(promesa).toBeResolvedTo(undefined);
    });

    it('dado un error 500, cuando pido el presupuesto, deberia rechazar la promesa', async () => {
      const promesa = service.getPresupuesto('alumno-x');
      httpMock
        .expectOne(`${API}/budgets/student/alumno-x/active`)
        .flush('boom', { status: 500, statusText: 'Server Error' });

      await expectAsync(promesa).toBeRejected();
    });

    it('dado un alumnoId con caracteres especiales, cuando pido el presupuesto, deberia encodearlo en la URL', async () => {
      const promesa = service.getPresupuesto('id con espacio');
      const req = httpMock.expectOne(`${API}/budgets/student/id%20con%20espacio/active`);
      req.flush(null);

      await expectAsync(promesa).toBeResolvedTo(undefined);
    });
  });

  describe('getCategoriasDisponibles', () => {
    it('dado el back, cuando pido categorias, deberia hacer GET /categories y filtrar las inactivas', async () => {
      const promesa = service.getCategoriasDisponibles();
      const req = httpMock.expectOne(`${API}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush([
        { id: 'cat-1', descripcion: 'Bebidas', activo: true },
        { id: 'cat-2', descripcion: 'Lácteos' },
        { id: 'cat-3', descripcion: 'Obsoleta', activo: false },
      ]);

      expect(await promesa).toEqual([
        { id: 'cat-1', descripcion: 'Bebidas' },
        { id: 'cat-2', descripcion: 'Lácteos' },
      ]);
    });
  });

  describe('cargarPrediccion', () => {
    it('dado un alumnoId y periodo, cuando pido la prediccion, deberia hacer GET a /ia con el periodo y mapear el analisis IA', async () => {
      const promesa = service.cargarPrediccion(ALUMNO_ID_TEST, 'MENSUAL');
      const req = httpMock.expectOne(
        (r) =>
          r.url === `${IA}/alumnos/${ALUMNO_ID_TEST}/prediccion-gasto` &&
          r.params.get('periodo') === 'MENSUAL',
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        alumnoId: ALUMNO_ID_TEST,
        periodo: 'MENSUAL',
        gastoActual: 1500,
        gastoPredicho: 3000,
        promedioGastoDiario: 100,
        montoLimite: 5000,
        porcentajePresupuesto: 60,
        confianza: 0.8,
        diasRestantes: 10,
        categoriasMasConsumidas: [{ descripcion: 'Bebidas', montoTotal: 800 }],
        analisisIa: {
          resumen: 'Va bien',
          alertas: ['Faltan 10 dias'],
          recomendaciones: ['Reducir bebidas'],
        },
      });

      const resultado = await promesa;
      expect(resultado?.resumenIa).toBe('Va bien');
      expect(resultado?.alertas).toEqual(['Faltan 10 dias']);
      expect(resultado?.recomendaciones).toEqual(['Reducir bebidas']);
      expect(resultado?.categoriasMasConsumidas).toEqual([{ descripcion: 'Bebidas', montoTotal: 800 }]);
    });

    it('dado el back con 404, cuando pido la prediccion, deberia resolver con undefined', async () => {
      const promesa = service.cargarPrediccion(ALUMNO_ID_TEST, 'MENSUAL');
      httpMock
        .expectOne((r) => r.url === `${IA}/alumnos/${ALUMNO_ID_TEST}/prediccion-gasto`)
        .flush('not found', { status: 404, statusText: 'Not Found' });

      await expectAsync(promesa).toBeResolvedTo(undefined);
    });

    it('dado la prediccion sin analisisIa, cuando la pido, deberia mapear valores por defecto', async () => {
      const promesa = service.cargarPrediccion(ALUMNO_ID_TEST, 'SEMANAL');
      httpMock
        .expectOne((r) => r.url === `${IA}/alumnos/${ALUMNO_ID_TEST}/prediccion-gasto`)
        .flush({
          alumnoId: ALUMNO_ID_TEST,
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
    it('dado un alumnoId, dates e items, cuando llamo, deberia hacer POST con el body y devolver los validationResults', async () => {
      const dates = ['2026-07-05', '2026-07-06'];
      const items = [{ productId: 'prod-1', quantity: 2 }];

      const promesa = service.checkBudgetDates(ALUMNO_ID_TEST, dates, items);
      const req = httpMock.expectOne(`${API}/budgets/student/${ALUMNO_ID_TEST}/check-dates`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ dates, items });
      req.flush({
        validationResults: [
          { date: '2026-07-05', blocked: false, reason: null },
          { date: '2026-07-06', blocked: true, reason: 'Excede presupuesto' },
        ],
      });

      const resultado = await promesa;
      expect(resultado.length).toBe(2);
      expect(resultado[1].blocked).toBeTrue();
    });
  });

  describe('guardar', () => {
    it('dado un presupuesto sin id, cuando guardo, deberia hacer POST /budgets con el command mapeado', async () => {
      const nuevo = PresupuestoMother.crearVacio();
      nuevo.reglasCategoria = [ReglaCategoriaMother.crear({ porcentajeLimite: 50 })];

      const promesa = service.guardar(nuevo);
      const req = httpMock.expectOne(`${API}/budgets`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        studentId: ALUMNO_ID_TEST,
        creadorId: 'tutor-1',
        limitAmount: 4000,
        period: 'MENSUAL',
        startDate: '2026-06-01',
        categoryRules: [{ categoryId: 'cat-bebidas', porcentajeLimite: 50 }],
      });
      req.flush({
        id: 'pres-nuevo',
        alumnoId: ALUMNO_ID_TEST,
        montoLimiteGeneral: 4000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [],
      });

      expect((await promesa).id).toBe('pres-nuevo');
    });

    it('dado un presupuesto con id, cuando guardo, deberia hacer PUT /budgets/{id}', async () => {
      const existente = PresupuestoMother.crear();

      const promesa = service.guardar(existente);
      const req = httpMock.expectOne(`${API}/budgets/${PRESUPUESTO_ID_TEST}`);
      expect(req.request.method).toBe('PUT');
      req.flush({
        id: PRESUPUESTO_ID_TEST,
        alumnoId: ALUMNO_ID_TEST,
        montoLimiteGeneral: 5000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [],
      });

      await expectAsync(promesa).toBeResolved();
    });

    it('dado reglas inactivas, cuando guardo, deberia descartarlas al construir el command', async () => {
      const conInactivas = PresupuestoMother.crearVacio();
      conInactivas.reglasCategoria = [
        ReglaCategoriaMother.crear({ porcentajeLimite: 50 }),
        ReglaCategoriaMother.crearInactiva(),
      ];

      const promesa = service.guardar(conInactivas);
      const req = httpMock.expectOne(`${API}/budgets`);
      expect(req.request.body.categoryRules.length).toBe(1);
      expect(req.request.body.categoryRules[0].categoryId).toBe('cat-bebidas');
      req.flush({
        id: 'pres-1',
        alumnoId: ALUMNO_ID_TEST,
        montoLimiteGeneral: 4000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-06-01',
        activo: true,
        reglasCategoria: [],
      });
      await promesa;
    });

    it('dado que no hay perfil logueado, cuando guardo, deberia tirar el error de "No hay un usuario logueado"', async () => {
      servicioPerfil.getPerfil.and.returnValue(null);

      await expectAsync(service.guardar(PresupuestoMother.crear())).toBeRejectedWithError(
        'No hay un usuario logueado para crear el presupuesto.',
      );
    });
  });
});
