import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FavoritosService } from '../../favoritos/services/favoritos.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { BuffetService } from '../services/buffet.service';
import { CompraService } from '../../compra/services/compra.service';
import { CarritoService } from '../../compra/services/carrito.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RestriccionProductoService } from '../../restriccion-producto/services/restriccion-producto.service';
import { FranjasHorariasService } from '../../restricciones-horarias/services/franjas-horarias.service';
import { RestriccionesHorariasService } from '../../restricciones-horarias/services/restricciones-horarias.service';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { RestriccionesNutricionalesService } from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { PromotionService } from '../../../data-access/services/promociones/promotion.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Perfil } from '../../../data-access/models/perfil.model';
import { BuffetPresenter } from './buffet.presenter';
import { Producto } from '../models/producto.model';
import { AlumnoMother } from '../../../data-access/services/alumno.mother';
import { BuffetMother, ProductoMother } from '../buffet.mother';

describe('BuffetPresenter', () => {
  let presenter: BuffetPresenter;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioBuffet: jasmine.SpyObj<BuffetService>;
  let servicioFavoritos: jasmine.SpyObj<FavoritosService>;
  let servicioCompra: jasmine.SpyObj<CompraService>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;
  let servicioRestriccionProducto: jasmine.SpyObj<RestriccionProductoService>;
  let servicioFranjas: jasmine.SpyObj<FranjasHorariasService>;
  let servicioRestriccionesHorarias: jasmine.SpyObj<RestriccionesHorariasService>;
  let servicioPresupuesto: jasmine.SpyObj<PresupuestoService>;
  let servicioRestriccionesNutricionales: jasmine.SpyObj<RestriccionesNutricionalesService>;
  let servicioPromotion: jasmine.SpyObj<PromotionService>;
  let perfilService: Partial<PerfilService>;

  const ALUMNO = AlumnoMother.crear({
    id: 'alumno-1',
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: 'colegio-1',
    saldo: 25000,
  });
  const BUFFET = BuffetMother.crear();
  const PRODUCTO_DISPONIBLE = ProductoMother.crearDisponible();
  const PRODUCTO_BLOQUEADO_TUTOR = ProductoMother.crearBloqueadoPorTutor();
  const PRODUCTO_BLOQUEADO_RESTRICCION = ProductoMother.crearBloqueadoPorRestriccion();
  const PRODUCTOS = [PRODUCTO_DISPONIBLE, PRODUCTO_BLOQUEADO_TUTOR, PRODUCTO_BLOQUEADO_RESTRICCION];

  beforeEach(() => {
    servicioAlumnos = jasmine.createSpyObj<AlumnosService>('AlumnosService', ['getAlumnoById']);
    servicioBuffet = jasmine.createSpyObj<BuffetService>('BuffetService', [
      'obtenerBuffetDelAlumno',
      'getProductosDelBuffet',
    ]);
    servicioFavoritos = jasmine.createSpyObj<FavoritosService>('FavoritosService', [
      'getFavoritos',
      'agregarFavorito',
      'removerFavorito',
    ]);
    servicioCompra = jasmine.createSpyObj<CompraService>('CompraService', ['iniciarOrden', 'procesarPago']);
    servicioCarrito = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'agregar',
      'setCatalog',
      'cargarPresupuestoYConsumo',
      'getSeleccionRetiro',
      'setSeleccionRetiro',
    ]);
    const mockCarrito = servicioCarrito as unknown as {
      items: unknown;
      budgets: unknown;
      purchases: unknown;
    };
    mockCarrito.items = signal([]);
    mockCarrito.budgets = signal(new Map());
    mockCarrito.purchases = signal(new Map());
    servicioColegios = jasmine.createSpyObj<ColegiosService>('ColegiosService', ['getColegios']);
    servicioUsuario = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['homeUrl', 'esVistaAlumno']);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl', 'navigate']);
    servicioRestriccionProducto = jasmine.createSpyObj<RestriccionProductoService>(
      'RestriccionProductoService',
      ['bloquearProducto', 'desbloquearProducto'],
    );
    servicioFranjas = jasmine.createSpyObj<FranjasHorariasService>('FranjasHorariasService', ['getFranjasHorarias']);
    servicioRestriccionesHorarias = jasmine.createSpyObj<RestriccionesHorariasService>(
      'RestriccionesHorariasService',
      ['getRestriccionesPorAlumno'],
    );
    servicioPresupuesto = jasmine.createSpyObj<PresupuestoService>('PresupuestoService', [
      'checkBudgetDates',
      'getPresupuesto',
    ]);
    servicioRestriccionesNutricionales = jasmine.createSpyObj<RestriccionesNutricionalesService>(
      'RestriccionesNutricionalesService',
      ['getRestriccionesAlumno'],
    );
    servicioPromotion = jasmine.createSpyObj<PromotionService>('PromotionService', ['getPromotions']);

    aplicarDefaults();

    perfilService = {
      esPlanGratuito: signal(true),
      perfil: signal<Perfil | null>({ plan: 'FREE' } as unknown as Perfil),
    };

    TestBed.configureTestingModule({
      providers: [
        BuffetPresenter,
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: BuffetService, useValue: servicioBuffet },
        { provide: FavoritosService, useValue: servicioFavoritos },
        { provide: CompraService, useValue: servicioCompra },
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: perfilService },
        { provide: ToastService, useValue: servicioToast },
        { provide: Router, useValue: router },
        { provide: RestriccionProductoService, useValue: servicioRestriccionProducto },
        { provide: FranjasHorariasService, useValue: servicioFranjas },
        { provide: RestriccionesHorariasService, useValue: servicioRestriccionesHorarias },
        { provide: PresupuestoService, useValue: servicioPresupuesto },
        { provide: RestriccionesNutricionalesService, useValue: servicioRestriccionesNutricionales },
        { provide: PromotionService, useValue: servicioPromotion },
      ],
    });

    presenter = TestBed.inject(BuffetPresenter);
  });

  it('dado que se inyecta el presenter, deberia crearse correctamente', () => {
    expect(presenter).toBeTruthy();
  });

  describe('productosFiltrados — separacion bloqueo tutor vs restriccion', () => {
    it('dado vista tutor, cuando inicializo, deberia mostrar todos los productos (disponibles + bloqueados por tutor + restringidos)', fakeAsync(() => {
      givenVistaAlumno(false);

      whenInicializo('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.length).toBe(3);
    }));

    it('dado vista alumno, cuando inicializo, deberia ocultar los productos bloqueados por el tutor y por restriccion', fakeAsync(() => {
      givenVistaAlumno(true);

      whenInicializo('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.length).toBe(1);
      expect(filtrados.some((p) => p.id === 'prod-libre')).toBeTrue();
      expect(filtrados.some((p) => p.id === 'prod-tutor')).toBeFalse();
      expect(filtrados.some((p) => p.id === 'prod-restriccion')).toBeFalse();
    }));

    it('dado vista alumno, cuando inicializo, los productos disponibles deberian aparecer', fakeAsync(() => {
      givenVistaAlumno(true);

      whenInicializo('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.some((p) => p.id === 'prod-libre')).toBeTrue();
    }));

    it('dado vista tutor, cuando inicializo, los productos habilitados deben estar al principio y los bloqueados/sin stock al fondo', fakeAsync(() => {
      givenVistaAlumno(false);

      whenInicializo('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados[0].id).toBe('prod-libre');
      expect(filtrados[1].id).toBe('prod-tutor');
      expect(filtrados[2].id).toBe('prod-restriccion');
    }));
  });

  describe('toggleLock — bloqueo y desbloqueo manual', () => {
    it('dado un producto disponible, cuando lo bloqueo, deberia marcarlo optimistamente y llamar al servicio', () => {
      const producto = { ...PRODUCTO_DISPONIBLE, bloqueado: false };
      givenBloqueoOk();
      whenInicializoSinTick('alumno-1');

      whenToggleoLock(producto);

      expect(producto.bloqueado).toBeTrue();
      expect(servicioRestriccionProducto.bloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-libre');
      thenSeMostroToast('Se bloqueó "Agua Mineral"', 'success');
    });

    it('dado que el bloqueo falla, cuando toggleo lock, deberia revertir y mostrar un toast de error', () => {
      spyOn(console, 'error');
      const producto = { ...PRODUCTO_DISPONIBLE, bloqueado: false };
      givenBloqueoFalla();
      whenInicializoSinTick('alumno-1');

      whenToggleoLock(producto);

      expect(producto.bloqueado).toBeFalse();
      thenSeMostroToast('Error al bloquear el producto', 'error');
    });

    it('dado un producto bloqueado por el tutor, cuando lo desbloqueo, deberia marcarlo optimistamente y llamar al servicio', () => {
      const producto = { ...PRODUCTO_BLOQUEADO_TUTOR, bloqueado: true };
      givenDesbloqueoOk();
      whenInicializoSinTick('alumno-1');

      whenToggleoLock(producto);

      expect(producto.bloqueado).toBeFalse();
      expect(servicioRestriccionProducto.desbloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-tutor');
      thenSeMostroToast('Se desbloqueó "Alfajor"', 'success');
    });

    it('dado que el desbloqueo falla, cuando toggleo lock, deberia revertir y mostrar un toast de error', () => {
      spyOn(console, 'error');
      const producto = { ...PRODUCTO_BLOQUEADO_TUTOR, bloqueado: true };
      givenDesbloqueoFalla();
      whenInicializoSinTick('alumno-1');

      whenToggleoLock(producto);

      expect(producto.bloqueado).toBeTrue();
      thenSeMostroToast('Error al desbloquear el producto', 'error');
    });
  });

  function aplicarDefaults(): void {
    servicioAlumnos.getAlumnoById.and.returnValue(ALUMNO);
    servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(of(BUFFET));
    servicioBuffet.getProductosDelBuffet.and.returnValue(of(PRODUCTOS));
    servicioFavoritos.getFavoritos.and.returnValue(of([]));
    servicioFavoritos.agregarFavorito.and.returnValue(of(undefined));
    servicioFavoritos.removerFavorito.and.returnValue(of(undefined));
    servicioColegios.getColegios.and.returnValue([{ id: 'colegio-1', nombre: 'Fernando Fader' }]);
    servicioUsuario.homeUrl.and.returnValue('/tutor');
    servicioUsuario.esVistaAlumno.and.returnValue(false);
    servicioFranjas.getFranjasHorarias.and.resolveTo([]);
    servicioRestriccionesHorarias.getRestriccionesPorAlumno.and.resolveTo([]);
    servicioPresupuesto.checkBudgetDates.and.resolveTo([]);
    servicioRestriccionesNutricionales.getRestriccionesAlumno.and.resolveTo([]);
    servicioPromotion.getPromotions.and.returnValue(of([]));
  }

  function givenVistaAlumno(esAlumno: boolean): void {
    servicioUsuario.esVistaAlumno.and.returnValue(esAlumno);
  }

  function givenBloqueoOk(): void {
    servicioRestriccionProducto.bloquearProducto.and.returnValue(of(undefined));
  }

  function givenDesbloqueoOk(): void {
    servicioRestriccionProducto.desbloquearProducto.and.returnValue(of(undefined));
  }

  function givenBloqueoFalla(): void {
    servicioRestriccionProducto.bloquearProducto.and.returnValue(throwError(() => new Error('Error de red')));
  }

  function givenDesbloqueoFalla(): void {
    servicioRestriccionProducto.desbloquearProducto.and.returnValue(throwError(() => new Error('Error de red')));
  }

  function whenInicializo(alumnoId: string): void {
    presenter.init(alumnoId);
    tick();
  }

  function whenInicializoSinTick(alumnoId: string): void {
    presenter.init(alumnoId);
  }

  function whenToggleoLock(producto: Producto): void {
    presenter.toggleLock(producto);
  }

  function thenSeMostroToast(mensaje: string, tipo: 'success' | 'error'): void {
    expect(servicioToast.mostrar).toHaveBeenCalledWith(mensaje, tipo);
  }
});
