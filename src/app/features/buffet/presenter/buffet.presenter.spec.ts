import { TestBed } from '@angular/core/testing';
import { signal, Signal } from '@angular/core';
import { ItemCarrito } from '../../compra/models/carrito.model';
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
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
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
  let presupuestoServiceSpy: jasmine.SpyObj<PresupuestoService>;

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

  const mockProductos: Producto[] = [
    {
      id: 'prod-1',
      nombre: 'Coca Cola',
      descripcion: 'Bebida',
      precio: 1000,
      categoria: { id: 'bebidas', descripcion: 'Bebidas' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'DISPONIBLE',
      bloqueado: false,
    },
    {
      id: 'prod-2',
      nombre: 'Alfajor',
      descripcion: 'Dulce',
      precio: 500,
      categoria: { id: 'snacks', descripcion: 'Snacks' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: 'DISPONIBLE',
      bloqueado: true,
    },
  ];

  beforeEach(() => {
    alumnosServiceSpy = jasmine.createSpyObj<AlumnosService>('AlumnosService', ['getAlumnoById']);
    buffetServiceSpy = jasmine.createSpyObj<BuffetService>('BuffetService', [
      'getBuffetDelAlumno',
      'getProductosDelBuffet',
    ]);
    favoritosServiceSpy = jasmine.createSpyObj<FavoritosService>('FavoritosService', ['getFavoritos']);
    carritoServiceSpy = jasmine.createSpyObj<CarritoService>('CarritoService', ['agregar']);
    colegiosServiceSpy = jasmine.createSpyObj<ColegiosService>('ColegiosService', ['getColegios']);
    usuarioServiceSpy = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'homeUrl',
      'esVistaAlumno',
    ]);
    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl', 'navigate']);
    restriccionProductoServiceSpy = jasmine.createSpyObj<RestriccionProductoService>(
      'RestriccionProductoService',
      ['bloquearProducto', 'desbloquearProducto']
    );
    presupuestoServiceSpy = jasmine.createSpyObj<PresupuestoService>('PresupuestoService', [
      'getPresupuesto',
      'cargarPrediccion',
    ]);

    // Default setups
    alumnosServiceSpy.getAlumnoById.and.returnValue(mockAlumno);
    buffetServiceSpy.getBuffetDelAlumno.and.returnValue(mockBuffet);
    buffetServiceSpy.getProductosDelBuffet.and.returnValue(of(mockProductos));
    favoritosServiceSpy.getFavoritos.and.returnValue(of([]));
    colegiosServiceSpy.getColegios.and.returnValue([{ id: 'colegio-1', nombre: 'Fernando Fader' }]);
    usuarioServiceSpy.homeUrl.and.returnValue('/tutor');
    usuarioServiceSpy.esVistaAlumno.and.returnValue(false);
    presupuestoServiceSpy.getPresupuesto.and.resolveTo(undefined);
    presupuestoServiceSpy.cargarPrediccion.and.resolveTo(undefined);

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
        { provide: PresupuestoService, useValue: presupuestoServiceSpy },
      ],
    });

    presenter = TestBed.inject(BuffetPresenter);
  });

  it('debería crearse el presenter', () => {
    expect(presenter).toBeTruthy();
  });

  describe('Control Parental / Bloqueo de Productos', () => {
    it('debería filtrar los productos bloqueados si esVistaAlumno es true', () => {
      usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
      presenter.init('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.length).toBe(1);
      expect(filtrados[0].id).toBe('prod-1'); // Alfajor (bloqueado) es excluido
    });

    it('no debería filtrar los productos bloqueados si esVistaAlumno es false (vista tutor)', () => {
      usuarioServiceSpy.esVistaAlumno.and.returnValue(false);
      presenter.init('alumno-1');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.length).toBe(2);
      expect(filtrados[0].id).toBe('prod-1');
      expect(filtrados[1].id).toBe('prod-2');
    });

    it('toggleLock debería bloquear un producto de forma optimista y llamar al servicio', () => {
      presenter.init('alumno-1');
      const producto = { ...mockProductos[0], bloqueado: false }; // Coca Cola
      restriccionProductoServiceSpy.bloquearProducto.and.returnValue(of(undefined));
      buffetServiceSpy.getProductosDelBuffet.calls.reset();

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeTrue();
      expect(restriccionProductoServiceSpy.bloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-1');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se bloqueó "Coca Cola"', 'success');
      expect(buffetServiceSpy.getProductosDelBuffet).toHaveBeenCalledWith('buffet-1', 'alumno-1');
    });

    it('toggleLock debería revertir el bloqueo si el servicio de bloqueo falla', () => {
      presenter.init('alumno-1');
      const producto = { ...mockProductos[0], bloqueado: false };
      restriccionProductoServiceSpy.bloquearProducto.and.returnValue(throwError(() => new Error('Error de red')));

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeFalse(); // Revertido
      expect(restriccionProductoServiceSpy.bloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-1');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al bloquear el producto', 'error');
    });

    it('toggleLock debería desbloquear un producto de forma optimista y llamar al servicio', () => {
      presenter.init('alumno-1');
      const producto = { ...mockProductos[1], bloqueado: true }; // Alfajor
      restriccionProductoServiceSpy.desbloquearProducto.and.returnValue(of(undefined));
      buffetServiceSpy.getProductosDelBuffet.calls.reset();

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeFalse();
      expect(restriccionProductoServiceSpy.desbloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-2');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se desbloqueó "Alfajor"', 'success');
      expect(buffetServiceSpy.getProductosDelBuffet).toHaveBeenCalledWith('buffet-1', 'alumno-1');
    });

    it('toggleLock debería revertir el desbloqueo si el servicio de desbloqueo falla', () => {
      presenter.init('alumno-1');
      const producto = { ...mockProductos[1], bloqueado: true };
      restriccionProductoServiceSpy.desbloquearProducto.and.returnValue(throwError(() => new Error('Error de red')));

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeTrue(); // Revertido
      expect(restriccionProductoServiceSpy.desbloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-2');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al desbloquear el producto', 'error');
    });
  });

  describe('Restricciones de Presupuesto', () => {
    it('debería bloquear productos de una categoría cuando el total combinado en el carrito supera el límite de esa categoría', async () => {
      // Setup active budget
      const mockBudget = {
        id: 'budget-1',
        alumnoId: 'alumno-1',
        montoLimiteGeneral: 5000,
        periodo: 'DIARIO' as const,
        fechaInicio: '2026-06-07',
        activo: true,
        reglasCategoria: [
          {
            id: 'regla-1',
            categoriaId: 'cat-uuid-bebidas',
            descripcionCategoria: 'Bebidas e Infusiones',
            porcentajeLimite: 40,
            montoLimiteCalculado: 2000,
            activo: true
          }
        ]
      };

      const mockSpending = {
        alumnoId: 'alumno-1',
        periodo: 'DIARIO' as const,
        gastoActual: 0,
        gastoPredicho: 0,
        promedioGastoDiario: 0,
        montoLimite: 5000,
        porcentajePresupuesto: 0,
        confianza: 1,
        diasRestantes: 1,
        categoriasMasConsumidas: [],
        resumenIa: '',
        alertas: [],
        recomendaciones: []
      };

      presupuestoServiceSpy.getPresupuesto.and.resolveTo(mockBudget);
      presupuestoServiceSpy.cargarPrediccion.and.resolveTo(mockSpending);

      // Setup products
      const p1: Producto = {
        id: 'prod-coca',
        nombre: 'Coca Cola 500ml',
        descripcion: 'Gaseosa',
        precio: 1200,
        categoria: { id: 'bebidas', descripcion: 'Bebidas' },
        clasificacionesSalud: [],
        imagen: '',
        estadoStock: 'DISPONIBLE',
        bloqueado: false
      };

      const p2: Producto = {
        id: 'prod-jugo',
        nombre: 'Jugo de Naranja 300ml',
        descripcion: 'Jugo',
        precio: 950,
        categoria: { id: 'bebidas', descripcion: 'Bebidas' },
        clasificacionesSalud: [],
        imagen: '',
        estadoStock: 'DISPONIBLE',
        bloqueado: false
      };

      buffetServiceSpy.getProductosDelBuffet.and.returnValue(of([p1, p2]));

      // Mock CarritoService.items signal property
      const cartItemsSignal = signal<ItemCarrito[]>([]);
      (carritoServiceSpy as unknown as { items: Signal<ItemCarrito[]> }).items = cartItemsSignal;

      // Initialize presenter
      presenter.init('alumno-1');
      
      // Wait for async budget load
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert initially both are available
      let products = presenter.productosConPresupuesto();
      expect(products.find(p => p.id === 'prod-coca')?.estadoStock).toBe('DISPONIBLE');
      expect(products.find(p => p.id === 'prod-jugo')?.estadoStock).toBe('DISPONIBLE');

      // Now add Coca Cola to the cart
      cartItemsSignal.set([
        {
          id: 'item-1',
          alumnoId: 'alumno-1',
          producto: p1,
          cantidad: 1
        }
      ]);

      // Assert productsConPresupuesto updates reactively
      products = presenter.productosConPresupuesto();
      
      const updatedCoca = products.find(p => p.id === 'prod-coca');
      const updatedJugo = products.find(p => p.id === 'prod-jugo');

      // Adding another Coca Cola ($1200) would bring category total to 1200 + 1200 = 2400 > 2000, so it should be blocked
      expect(updatedCoca?.estadoStock).toBe('SIN_STOCK');
      expect(updatedCoca?.motivoBloqueo).toBe('Supera límite de su categoría');

      // Adding Jugo ($950) would bring category total to 1200 + 950 = 2150 > 2000, so it should be blocked
      expect(updatedJugo?.estadoStock).toBe('SIN_STOCK');
      expect(updatedJugo?.motivoBloqueo).toBe('Supera límite de su categoría');
    });
  });
});
