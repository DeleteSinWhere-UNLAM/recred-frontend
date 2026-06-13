import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { BuffetService } from '../services/buffet.service';
import { FavoritosService } from '../../favoritos/services/favoritos.service';
import { CarritoService } from '../../compra/services/carrito.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RestriccionProductoService } from '../../restriccion-producto/services/restriccion-producto.service';
import { BuffetPresenter } from './buffet.presenter';
import { Alumno } from '../../../data-access/models/alumno.model';
import { Buffet } from '../models/buffet.model';
import { Producto } from '../models/producto.model';

describe('BuffetPresenter', () => {
  let presenter: BuffetPresenter;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let buffetServiceSpy: jasmine.SpyObj<BuffetService>;
  let favoritosServiceSpy: jasmine.SpyObj<FavoritosService>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let colegiosServiceSpy: jasmine.SpyObj<ColegiosService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let restriccionProductoServiceSpy: jasmine.SpyObj<RestriccionProductoService>;

  const mockAlumno: Alumno = {
    id: 'alumno-1',
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: 'colegio-1',
    saldo: 25000,
  };

  const mockBuffet: Buffet = {
    id: 'buffet-1',
    nombre: 'El Buffet de Mariano',
    colegioId: 'colegio-1',
  };

  const productoBloqueadoPorTutor: Producto = {
    id: 'prod-tutor',
    nombre: 'Alfajor',
    descripcion: 'Dulce',
    precio: 500,
    categoria: { id: 'snacks', descripcion: 'Snacks' },
    clasificacionesSalud: [],
    imagen: '',
    estadoStock: 'SIN_STOCK',
    bloqueado: true,
  };

  const productoBloqueadoPorRestriccion: Producto = {
    id: 'prod-restriccion',
    nombre: 'Galletitas Oreo',
    descripcion: 'Con TACC',
    precio: 400,
    categoria: { id: 'snacks', descripcion: 'Snacks' },
    clasificacionesSalud: [],
    imagen: '',
    estadoStock: 'SIN_STOCK',
    bloqueado: false,
    bloqueadoPorRestriccion: true,
    motivoBloqueo: 'Contiene: Gluten (TACC)',
  };

  const productoDisponible: Producto = {
    id: 'prod-libre',
    nombre: 'Agua Mineral',
    descripcion: 'Bebida',
    precio: 300,
    categoria: { id: 'bebidas', descripcion: 'Bebidas' },
    clasificacionesSalud: [],
    imagen: '',
    estadoStock: 'DISPONIBLE',
    bloqueado: false,
  };

  const mockProductos: Producto[] = [
    productoDisponible,
    productoBloqueadoPorTutor,
    productoBloqueadoPorRestriccion,
  ];

  beforeEach(() => {
    alumnosServiceSpy = jasmine.createSpyObj<AlumnosService>('AlumnosService', ['getAlumnoById']);
    buffetServiceSpy = jasmine.createSpyObj<BuffetService>('BuffetService', [
      'getBuffetDelAlumno', 'getProductosDelBuffet',
    ]);
    favoritosServiceSpy = jasmine.createSpyObj<FavoritosService>('FavoritosService', ['getFavoritos']);
    carritoServiceSpy = jasmine.createSpyObj<CarritoService>('CarritoService', ['agregar', 'setCatalog', 'cargarPresupuestoYConsumo']);
    const mockCarrito = carritoServiceSpy as unknown as {
      items: unknown;
      budgets: unknown;
      purchases: unknown;
    };
    mockCarrito.items = signal([]);
    mockCarrito.budgets = signal(new Map());
    mockCarrito.purchases = signal(new Map());
    colegiosServiceSpy = jasmine.createSpyObj<ColegiosService>('ColegiosService', ['getColegios']);
    usuarioServiceSpy = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['homeUrl', 'esVistaAlumno']);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl', 'navigate']);
    restriccionProductoServiceSpy = jasmine.createSpyObj<RestriccionProductoService>(
      'RestriccionProductoService', ['bloquearProducto', 'desbloquearProducto']
    );

    alumnosServiceSpy.getAlumnoById.and.returnValue(mockAlumno);
    buffetServiceSpy.getBuffetDelAlumno.and.returnValue(mockBuffet);
    buffetServiceSpy.getProductosDelBuffet.and.returnValue(of(mockProductos));
    favoritosServiceSpy.getFavoritos.and.returnValue(of([]));
    colegiosServiceSpy.getColegios.and.returnValue([{ id: 'colegio-1', nombre: 'Fernando Fader' }]);
    usuarioServiceSpy.homeUrl.and.returnValue('/tutor');
    usuarioServiceSpy.esVistaAlumno.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        BuffetPresenter,
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: BuffetService, useValue: buffetServiceSpy },
        { provide: FavoritosService, useValue: favoritosServiceSpy },
        { provide: CarritoService, useValue: carritoServiceSpy },
        { provide: ColegiosService, useValue: colegiosServiceSpy },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: RestriccionProductoService, useValue: restriccionProductoServiceSpy },
      ],
    });

    presenter = TestBed.inject(BuffetPresenter);
  });

  it('debería crearse el presenter', () => {
    expect(presenter).toBeTruthy();
  });

  // ── Separación de tipos de bloqueo en productosFiltrados ──────────────────

  describe('productosFiltrados — separación bloqueo tutor vs restricción', () => {
    it('en vista tutor: debe mostrar todos los productos (disponibles, bloqueados por tutor y por restricción)', () => {
      usuarioServiceSpy.esVistaAlumno.and.returnValue(false);
      presenter.init('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.length).toBe(3);
    });

    it('en vista alumno: debe ocultar solo los productos bloqueados por el tutor', () => {
      usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
      presenter.init('alumno-1');

      const filtrados = presenter.productosFiltrados();
      // El bloqueado por tutor (Alfajor) queda fuera; el de restricción (Oreo) debe aparecer
      expect(filtrados.length).toBe(2);
      expect(filtrados.some(p => p.id === 'prod-tutor')).toBeFalse();
    });

    it('en vista alumno: los productos con restricción nutricional deben aparecer (no ocultarse)', () => {
      usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
      presenter.init('alumno-1');

      const filtrados = presenter.productosFiltrados();
      const oreo = filtrados.find(p => p.id === 'prod-restriccion');
      expect(oreo).toBeDefined();
      expect(oreo?.bloqueadoPorRestriccion).toBeTrue();
    });

    it('en vista alumno: los productos disponibles deben aparecer', () => {
      usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
      presenter.init('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.some(p => p.id === 'prod-libre')).toBeTrue();
    });
  });

  // ── toggleLock ─────────────────────────────────────────────────────────────

  describe('toggleLock — bloqueo y desbloqueo manual', () => {
    it('debería bloquear un producto de forma optimista y llamar al servicio', () => {
      presenter.init('alumno-1');
      const producto = { ...productoDisponible, bloqueado: false };
      restriccionProductoServiceSpy.bloquearProducto.and.returnValue(of(undefined));

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeTrue();
      expect(restriccionProductoServiceSpy.bloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-libre');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se bloqueó "Agua Mineral"', 'success');
    });

    it('debería revertir el bloqueo optimista si el servicio falla', () => {
      presenter.init('alumno-1');
      const producto = { ...productoDisponible, bloqueado: false };
      restriccionProductoServiceSpy.bloquearProducto.and.returnValue(throwError(() => new Error('Error de red')));

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeFalse();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al bloquear el producto', 'error');
    });

    it('debería desbloquear un producto de forma optimista y llamar al servicio', () => {
      presenter.init('alumno-1');
      const producto = { ...productoBloqueadoPorTutor, bloqueado: true };
      restriccionProductoServiceSpy.desbloquearProducto.and.returnValue(of(undefined));

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeFalse();
      expect(restriccionProductoServiceSpy.desbloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-tutor');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se desbloqueó "Alfajor"', 'success');
    });

    it('debería revertir el desbloqueo optimista si el servicio falla', () => {
      presenter.init('alumno-1');
      const producto = { ...productoBloqueadoPorTutor, bloqueado: true };
      restriccionProductoServiceSpy.desbloquearProducto.and.returnValue(throwError(() => new Error('Error de red')));

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeTrue();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al desbloquear el producto', 'error');
    });
  });
});
