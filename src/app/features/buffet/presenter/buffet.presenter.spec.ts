import { TestBed } from '@angular/core/testing';
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

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeTrue();
      expect(restriccionProductoServiceSpy.bloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-1');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se bloqueó "Coca Cola"', 'success');
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

      presenter.toggleLock(producto);

      expect(producto.bloqueado).toBeFalse();
      expect(restriccionProductoServiceSpy.desbloquearProducto).toHaveBeenCalledWith('alumno-1', 'prod-2');
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se desbloqueó "Alfajor"', 'success');
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
});
