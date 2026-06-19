import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BuffetPresenter } from './buffet.presenter';
import { Router } from '@angular/router';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { BuffetService } from '../services/buffet.service';
import { FavoritosService } from '../../favoritos/services/favoritos.service';
import { CarritoService } from '../../compra/services/carrito.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RestriccionProductoService } from '../../restriccion-producto/services/restriccion-producto.service';
import { FranjasHorariasService } from '../../restricciones-horarias/services/franjas-horarias.service';
import { RestriccionesHorariasService } from '../../restricciones-horarias/services/restricciones-horarias.service';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { RestriccionesNutricionalesService } from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { of, throwError } from 'rxjs';
import { Alumno } from '../../../data-access/models/alumno.model';

describe('BuffetPresenter', () => {
  let presenter: BuffetPresenter;

  // Spies
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let buffetServiceSpy: jasmine.SpyObj<BuffetService>;
  let favoritosServiceSpy: jasmine.SpyObj<FavoritosService>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;
  let colegiosServiceSpy: jasmine.SpyObj<ColegiosService>;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let restriccionProductoServiceSpy: jasmine.SpyObj<RestriccionProductoService>;
  let franjasServiceSpy: jasmine.SpyObj<FranjasHorariasService>;
  let restriccionesHorariasSpy: jasmine.SpyObj<RestriccionesHorariasService>;
  let presupuestoServiceSpy: jasmine.SpyObj<PresupuestoService>;
  let restriccionesNutricionalesSpy: jasmine.SpyObj<RestriccionesNutricionalesService>;

  const mockAlumno: Alumno = { id: 'a1', nombre: 'Juan', apellido: 'Perez', colegioId: 'c1', saldo: 1000, grado: '1A', urlFotoPerfil: 'url' } as any;
  const mockBuffet = { id: 'b1', nombre: 'Buffet Central' };
  const mockFranjas = [{ id: 'f1', horaInicio: '10:00', horaFin: '10:30', descripcion: 'PRIMER RECREO' }];
  const mockRestriccionesHorarias = [{ id: 'r1', activa: true, timeSlotId: 'f2' }];
  
  beforeEach(() => {
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['getAlumnoById']);
    buffetServiceSpy = jasmine.createSpyObj('BuffetService', ['obtenerBuffetDelAlumno', 'getProductosDelBuffet']);
    favoritosServiceSpy = jasmine.createSpyObj('FavoritosService', ['getFavoritos', 'agregarFavorito', 'removerFavorito']);
    carritoServiceSpy = jasmine.createSpyObj('CarritoService', ['getSeleccionRetiro', 'setSeleccionRetiro', 'setCatalog', 'cargarPresupuestoYConsumo', 'items', 'budgets', 'purchases', 'agregar']);
    colegiosServiceSpy = jasmine.createSpyObj('ColegiosService', ['getColegios']);
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['homeUrl', 'esVistaAlumno']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['mostrar']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    restriccionProductoServiceSpy = jasmine.createSpyObj('RestriccionProductoService', ['desbloquearProducto', 'bloquearProducto']);
    franjasServiceSpy = jasmine.createSpyObj('FranjasHorariasService', ['getFranjasHorarias']);
    restriccionesHorariasSpy = jasmine.createSpyObj('RestriccionesHorariasService', ['getRestriccionesPorAlumno']);
    presupuestoServiceSpy = jasmine.createSpyObj('PresupuestoService', ['checkBudgetDates']);
    restriccionesNutricionalesSpy = jasmine.createSpyObj('RestriccionesNutricionalesService', ['getRestriccionesAlumno']);

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
        { provide: FranjasHorariasService, useValue: franjasServiceSpy },
        { provide: RestriccionesHorariasService, useValue: restriccionesHorariasSpy },
        { provide: PresupuestoService, useValue: presupuestoServiceSpy },
        { provide: RestriccionesNutricionalesService, useValue: restriccionesNutricionalesSpy }
      ]
    });

    presenter = TestBed.inject(BuffetPresenter);

    // Default setups
    usuarioServiceSpy.homeUrl.and.returnValue('/home');
    alumnosServiceSpy.getAlumnoById.and.returnValue(mockAlumno);
    carritoServiceSpy.getSeleccionRetiro.and.returnValue({ fecha: '2050-01-01', recreo: 'PRIMER_RECREO' });
    carritoServiceSpy.items.and.returnValue([]);
    carritoServiceSpy.budgets.and.returnValue(new Map());
    carritoServiceSpy.purchases.and.returnValue(new Map());
    colegiosServiceSpy.getColegios.and.returnValue([{ id: 'c1', nombre: 'Colegio 1' }] as any);
    usuarioServiceSpy.esVistaAlumno.and.returnValue(false);
    
    favoritosServiceSpy.getFavoritos.and.returnValue(of([{ id: 'p1' }] as any));
    restriccionesNutricionalesSpy.getRestriccionesAlumno.and.returnValue(Promise.resolve([]));
    buffetServiceSpy.obtenerBuffetDelAlumno.and.returnValue(of(mockBuffet as any));
    franjasServiceSpy.getFranjasHorarias.and.returnValue(Promise.resolve(mockFranjas as any));
    restriccionesHorariasSpy.getRestriccionesPorAlumno.and.returnValue(Promise.resolve(mockRestriccionesHorarias as any));
    presupuestoServiceSpy.checkBudgetDates.and.returnValue(Promise.resolve([{ date: '2050-01-01', blocked: false, reason: null }]));
    buffetServiceSpy.getProductosDelBuffet.and.returnValue(of([
      { id: 'p1', nombre: 'P1', precio: 10, categoria: { id: 'cat1', descripcion: 'Cat1' }, clasificacionesSalud: [] } as any
    ]));
  });

  describe('init', () => {
    it('debería redirigir al home si no existe el alumno', () => {
      alumnosServiceSpy.getAlumnoById.and.returnValue(undefined);
      presenter.init('invalid');
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
    });

    it('debería inicializar datos correctamente', fakeAsync(() => {
      presenter.init('a1');
      tick(); // resolve promises
      
      expect(presenter.alumno()).toEqual(mockAlumno);
      expect(presenter.buffet()).toEqual(mockBuffet as any);
      expect(presenter.franjas().length).toBe(1);
      expect(presenter.productos().length).toBe(1);
      expect(presenter.favoritos().has('p1')).toBeTrue();
      expect(presenter.categorias().length).toBe(1);
      expect(presenter.nombreCompleto()).toBe('Juan Perez');
      expect(presenter.nombreColegio()).toBe('Colegio 1');
      expect(presenter.urlFotoPerfil()).toBe('url');
      expect(presenter.iniciales()).toBe('JP');
      expect(presenter.grado()).toBe('1A');
      expect(presenter.saldo()).toBe(1000);
      expect(carritoServiceSpy.setCatalog).toHaveBeenCalled();
    }));

    it('debería manejar errores de favoritos y restricciones nutricionales', fakeAsync(() => {
      favoritosServiceSpy.getFavoritos.and.returnValue(throwError(() => new Error('Error')));
      restriccionesNutricionalesSpy.getRestriccionesAlumno.and.returnValue(Promise.reject('Error'));
      presenter.init('a1');
      tick();
      expect(presenter.favoritos().size).toBe(0);
    }));

    it('debería redirigir a home y mostrar error si buffet falla', fakeAsync(() => {
      buffetServiceSpy.obtenerBuffetDelAlumno.and.returnValue(throwError(() => new Error('Error')));
      presenter.init('a1');
      tick();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('No se pudo cargar el buffet del alumno', 'error');
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
    }));

    it('debería hacer fallback de carga de productos si franjas falla', fakeAsync(() => {
      franjasServiceSpy.getFranjasHorarias.and.returnValue(Promise.reject('Error'));
      presenter.init('a1');
      tick();
      expect(buffetServiceSpy.getProductosDelBuffet).toHaveBeenCalled();
    }));
  });

  describe('Acciones de Filtrado y Búsqueda', () => {
    beforeEach(fakeAsync(() => {
      presenter.init('a1');
      tick();
    }));

    it('buscar', () => {
      presenter.buscar('P1');
      expect(presenter.filtros().busqueda).toBe('P1');
    });

    it('seleccionarCategoria', () => {
      presenter.seleccionarCategoria('cat1');
      expect(presenter.filtros().categoriaId).toBe('cat1');
    });

    it('seleccionarClasificacion', () => {
      presenter.seleccionarClasificacion('clasif1');
      expect(presenter.filtros().clasificacionId).toBe('clasif1');
    });

    it('toggleSoloFavoritos', () => {
      presenter.toggleSoloFavoritos();
      expect(presenter.filtros().soloFavoritos).toBeTrue();
    });

    it('setPrecioMin y Max', () => {
      presenter.setPrecioMin(5);
      presenter.setPrecioMax(15);
      expect(presenter.filtros().precioMin).toBe(5);
      expect(presenter.filtros().precioMax).toBe(15);
    });

    it('limpiarFiltros', () => {
      presenter.buscar('hola');
      presenter.limpiarFiltros();
      expect(presenter.filtros().busqueda).toBe('');
    });
  });

  describe('Acciones de Navegación e Interacción', () => {
    beforeEach(fakeAsync(() => {
      presenter.init('a1');
      tick();
    }));

    it('volver e irAlCarrito', () => {
      presenter.volver();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home');
      presenter.irAlCarrito();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/compra');
    });

    it('cambiarAlumno', () => {
      presenter.cambiarAlumno('a2');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/buffet', 'a2']);
    });

    it('agregarAlCarrito', () => {
      presenter.agregarAlCarrito({ id: 'p1', nombre: 'Test', precio: 10 } as any, 2);
      expect(carritoServiceSpy.agregar).toHaveBeenCalled();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se agregaron 2x "Test" al carrito');
    });

    it('toggleFavorito agregar', () => {
      favoritosServiceSpy.agregarFavorito.and.returnValue(of({} as any));
      presenter.toggleFavorito({ id: 'p2', nombre: 'P2' } as any);
      expect(presenter.favoritos().has('p2')).toBeTrue();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se agregó "P2" a tus favoritos', 'success');
    });

    it('toggleFavorito quitar', () => {
      favoritosServiceSpy.removerFavorito.and.returnValue(of({} as any));
      // p1 is already favorite
      presenter.toggleFavorito({ id: 'p1', nombre: 'P1' } as any);
      expect(presenter.favoritos().has('p1')).toBeFalse();
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se quitó "P1" de tus favoritos', 'success');
    });

    it('toggleLock', () => {
      const prod = { id: 'p1', nombre: 'P1', bloqueado: false } as any;
      restriccionProductoServiceSpy.bloquearProducto.and.returnValue(of({} as any));
      presenter.toggleLock(prod);
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se bloqueó "P1"', 'success');

      prod.bloqueado = true; // after update
      restriccionProductoServiceSpy.desbloquearProducto.and.returnValue(of({} as any));
      presenter.toggleLock(prod);
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Se desbloqueó "P1"', 'success');
    });

    it('toggleLock error fallback', () => {
      const prod = { id: 'p1', nombre: 'P1', bloqueado: false } as any;
      restriccionProductoServiceSpy.bloquearProducto.and.returnValue(throwError(() => new Error('Error')));
      presenter.toggleLock(prod);
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al bloquear el producto', 'error');

      const prod2 = { id: 'p1', nombre: 'P1', bloqueado: true } as any;
      restriccionProductoServiceSpy.desbloquearProducto.and.returnValue(throwError(() => new Error('Error')));
      presenter.toggleLock(prod2);
      expect(toastServiceSpy.mostrar).toHaveBeenCalledWith('Error al desbloquear el producto', 'error');
    });
  });

  describe('Computed y Fechas', () => {
    it('debería calcular totales del carrito', fakeAsync(() => {
      presenter.init('a1');
      tick();
      carritoServiceSpy.items.and.returnValue([
        { alumnoId: 'a1', producto: { precio: 10 }, cantidad: 2 } as any,
        { alumnoId: 'a2', producto: { precio: 50 }, cantidad: 1 } as any // ignore
      ]);
      expect(presenter.itemsCarrito().length).toBe(1);
      expect(presenter.totalCarrito()).toBe(20);
      expect(presenter.cantidadItemsCarrito()).toBe(2);
    }));

    it('debería establecer la fecha y evitar fines de semana', fakeAsync(() => {
      presenter.init('a1');
      tick();
      // '2050-01-01' es sábado (fin de semana) -> siguiente día hábil -> 2050-01-03
      presenter.setFecha('2050-01-01');
      tick();
      expect(presenter.fechaSeleccionada()).toBe('2050-01-03');
    }));

    it('debería mapear correctamente los recreos y todas sus ramas', fakeAsync(() => {
      presenter.init('a1');
      tick();
      
      // Test all branches of matchesDescription
      franjasServiceSpy.getFranjasHorarias.and.returnValue(Promise.resolve([
        { id: 'f1', horaInicio: '10:00', horaFin: '10:15', descripcion: 'PRIMER RECREO' },
        { id: 'f2', horaInicio: '12:00', horaFin: '12:15', descripcion: 'SEGUNDO RECREO' },
        { id: 'f3', horaInicio: '13:00', horaFin: '13:30', descripcion: 'MEDIO DIA' },
        { id: 'f4', horaInicio: '16:00', horaFin: '16:15', descripcion: 'SALIDA FINAL' },
        { id: 'f5', horaInicio: '17:00', horaFin: '17:15', descripcion: 'OTRO RECREO NO MATCH' }
      ] as any));
      
      // re-trigger init to load new franjas
      presenter.init('a1');
      tick();

      const recreos = presenter.recreosDisponibles();
      expect(recreos.length).toBeGreaterThan(0);
      expect(recreos.some(r => r.recreo === 'PRIMER_RECREO')).toBeTrue();
      expect(recreos.some(r => r.recreo === 'SEGUNDO_RECREO')).toBeTrue();
      expect(recreos.some(r => r.recreo === 'MEDIODIA')).toBeTrue();
      expect(recreos.some(r => r.recreo === 'FUERA_HORA')).toBeTrue();
    }));

    it('debería validar presupuesto', fakeAsync(() => {
      presenter.init('a1');
      tick();
      
      const fakeBudget = {
        activo: true, periodo: 'MENSUAL', montoLimiteGeneral: 500, reglasCategoria: [{ activo: true, categoriaId: 'cat1', descripcionCategoria: 'Cat1', montoLimiteCalculado: 200 }]
      };
      const budgetsMap = new Map();
      budgetsMap.set('a1', fakeBudget);
      carritoServiceSpy.budgets.and.returnValue(budgetsMap);

      const res = presenter.presupuestoDisponible();
      expect(res).toBeTruthy();
      expect(res?.montoLimiteGeneral).toBe(500); // Because saldo is 1000 => limit is 500
      expect(res?.reglasCategorias.length).toBe(1);
    }));

    it('debería aplicar filtros a productosFiltrados', fakeAsync(() => {
      buffetServiceSpy.getProductosDelBuffet.and.returnValue(of([
        { id: 'p1', nombre: 'Alfa', precio: 10, categoria: { id: 'c1' }, clasificacionesSalud: [{ id: 'cs1' }], bloqueado: false },
        { id: 'p2', nombre: 'Beta', precio: 20, categoria: { id: 'c2' }, clasificacionesSalud: [], bloqueado: true, bloqueadoPorRestriccion: true, motivoBloqueo: 'Contiene azucar' }
      ] as any));
      presenter.init('a1');
      tick();

      // Vista alumno oculta bloqueados
      usuarioServiceSpy.esVistaAlumno.and.returnValue(true);
      expect(presenter.productosFiltrados().length).toBe(1); // p2 es ocultado

      // Búsqueda
      usuarioServiceSpy.esVistaAlumno.and.returnValue(false);
      presenter.buscar('beta');
      expect(presenter.productosFiltrados().length).toBe(1); // p2

      presenter.limpiarFiltros();
      presenter.seleccionarCategoria('c1');
      expect(presenter.productosFiltrados().length).toBe(1); // p1

      presenter.limpiarFiltros();
      presenter.seleccionarClasificacion('cs1');
      expect(presenter.productosFiltrados().length).toBe(1); // p1

      presenter.limpiarFiltros();
      presenter.setPrecioMax(15);
      expect(presenter.productosFiltrados().length).toBe(1); // p1

      presenter.limpiarFiltros();
      presenter.setPrecioMin(15);
      expect(presenter.productosFiltrados().length).toBe(1); // p2

      // Favoritos
      presenter.limpiarFiltros();
      presenter.toggleSoloFavoritos();
      expect(presenter.productosFiltrados().length).toBe(1); // None is favorite according to mock
    }));

    it('setRecreo', fakeAsync(() => {
      presenter.init('a1');
      tick();
      presenter.setRecreo('SEGUNDO_RECREO');
      expect(presenter.recreoSeleccionado()).toBe('SEGUNDO_RECREO');
      expect(carritoServiceSpy.setSeleccionRetiro).toHaveBeenCalled();
    }));
  });

  describe('Manejo de errores del Budget check', () => {
    it('debería manejar el error de la promesa', fakeAsync(() => {
      presupuestoServiceSpy.checkBudgetDates.and.returnValue(Promise.reject('Network Error'));
      presenter.init('a1');
      tick();
      expect(presenter.presupuestoPorFecha()).toBeNull();
    }));
  });
});
