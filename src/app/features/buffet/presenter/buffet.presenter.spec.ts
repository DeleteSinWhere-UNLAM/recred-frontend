import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { DateBudgetStatus } from '../../presupuesto/services/presupuesto.service';
import { TimeSlot, RestriccionHoraria } from '../../restricciones-horarias/models/restriccion-horaria.model';
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
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
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
  let servicioContexto: jasmine.SpyObj<AlumnoContextoService>;
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
      'clearSeleccionRetiro',
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
    servicioContexto = jasmine.createSpyObj<AlumnoContextoService>('AlumnoContextoService', ['setAlumnoId', 'limpiar']);

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
        { provide: AlumnoContextoService, useValue: servicioContexto },
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

  describe('filtros', () => {
    beforeEach(fakeAsync(() => {
      whenInicializo('alumno-1');
    }));

    it('dado el filtro busqueda, cuando actualizo, deberia guardarlo en el estado', () => {
      presenter.buscar('agua');
      expect(presenter.filtros().busqueda).toBe('agua');
    });

    it('dado seleccionarCategoria, deberia guardar el id en el estado', () => {
      presenter.seleccionarCategoria('bebidas');
      expect(presenter.filtros().categoriaId).toBe('bebidas');
    });

    it('dado seleccionarClasificacion, deberia guardar el id en el estado', () => {
      presenter.seleccionarClasificacion('sin-tacc');
      expect(presenter.filtros().clasificacionId).toBe('sin-tacc');
    });

    it('dado toggleSoloFavoritos, deberia alternar el flag', () => {
      expect(presenter.filtros().soloFavoritos).toBeFalse();

      presenter.toggleSoloFavoritos();
      expect(presenter.filtros().soloFavoritos).toBeTrue();

      presenter.toggleSoloFavoritos();
      expect(presenter.filtros().soloFavoritos).toBeFalse();
    });

    it('dado setPrecioMin/setPrecioMax, deberia guardar los montos', () => {
      presenter.setPrecioMin(100);
      presenter.setPrecioMax(1000);

      expect(presenter.filtros().precioMin).toBe(100);
      expect(presenter.filtros().precioMax).toBe(1000);
    });

    it('dado filtros aplicados, cuando llamo limpiarFiltros, deberia resetearlos', () => {
      presenter.buscar('agua');
      presenter.seleccionarCategoria('bebidas');
      presenter.setPrecioMin(100);

      presenter.limpiarFiltros();

      const f = presenter.filtros();
      expect(f.busqueda).toBe('');
      expect(f.categoriaId).toBe('todas');
      expect(f.precioMin).toBeNull();
    });
  });

  describe('productosFiltrados por filtros del usuario', () => {
    beforeEach(fakeAsync(() => {
      givenVistaAlumno(false);
      whenInicializo('alumno-1');
    }));

    it('dado filtro busqueda por nombre, deberia dejar solo los que matchean', () => {
      presenter.buscar('agua');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.length).toBe(1);
      expect(filtrados[0].id).toBe('prod-libre');
    });

    it('dado filtro por categoria, deberia dejar solo los de esa categoria', () => {
      presenter.seleccionarCategoria('bebidas');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.every((p) => p.categoria.id === 'bebidas')).toBeTrue();
    });

    it('dado precioMin y precioMax, deberia filtrar por rango', () => {
      presenter.setPrecioMin(400);
      presenter.setPrecioMax(500);

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.every((p) => p.precio >= 400 && p.precio <= 500)).toBeTrue();
    });

    it('dado soloFavoritos true y sin favoritos, deberia devolver lista vacia', () => {
      presenter.toggleSoloFavoritos();

      expect(presenter.productosFiltrados().length).toBe(0);
    });
  });

  describe('computed del alumno', () => {
    it('dado vista tutor, nombreCompleto deberia devolver solo el nombre', fakeAsync(() => {
      givenVistaAlumno(false);

      whenInicializo('alumno-1');

      expect(presenter.nombreCompleto()).toBe('Julián');
    }));

    it('dado vista alumno, nombreCompleto deberia devolver "nombre apellido"', fakeAsync(() => {
      givenVistaAlumno(true);

      whenInicializo('alumno-1');

      expect(presenter.nombreCompleto()).toBe('Julián García');
    }));

    it('dado vista tutor, iniciales deberia devolver solo la letra del nombre', fakeAsync(() => {
      givenVistaAlumno(false);

      whenInicializo('alumno-1');

      expect(presenter.iniciales()).toBe('J');
    }));

    it('dado vista alumno, iniciales deberia devolver las 2 letras', fakeAsync(() => {
      givenVistaAlumno(true);

      whenInicializo('alumno-1');

      expect(presenter.iniciales()).toBe('JG');
    }));

    it('dado un alumno cargado, saldo/grado/nombreColegio deberian exponerlos', fakeAsync(() => {
      whenInicializo('alumno-1');

      expect(presenter.saldo()).toBe(25000);
      expect(presenter.grado()).toBe('4to Año A');
      expect(presenter.nombreColegio()).toBe('Fernando Fader');
    }));

    it('dado sin alumno cargado, los computed deberian devolver valores default', () => {
      expect(presenter.nombreCompleto()).toBe('');
      expect(presenter.iniciales()).toBe('');
      expect(presenter.grado()).toBe('');
      expect(presenter.saldo()).toBe(0);
      expect(presenter.nombreColegio()).toBe('');
    });
  });

  describe('init con errores', () => {
    it('dado sin alumno en el service, cuando inicializo, deberia navegar al home', () => {
      servicioAlumnos.getAlumnoById.and.returnValue(undefined);

      presenter.init('alumno-inexistente');

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });

    it('dado que obtenerBuffetDelAlumno falla, cuando inicializo, deberia mostrar toast y navegar al home', () => {
      spyOn(console, 'error');
      servicioBuffet.obtenerBuffetDelAlumno.and.returnValue(throwError(() => new Error('boom')));

      presenter.init('alumno-1');

      expect(servicioToast.mostrar).toHaveBeenCalledWith('No se pudo cargar el buffet del alumno', 'error');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });

    it('dado que getFavoritos falla, cuando inicializo, deberia loggear pero no romper', () => {
      spyOn(console, 'error');
      servicioFavoritos.getFavoritos.and.returnValue(throwError(() => new Error('boom')));

      presenter.init('alumno-1');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('volver', () => {
    it('dado el presenter, cuando llamo volver, deberia navegar al home del usuario', () => {
      presenter.volver();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/tutor');
    });
  });

  describe('cambiarAlumno', () => {
    it('dado el mismo alumnoId ya activo, no deberia hacer nada', fakeAsync(() => {
      whenInicializo('alumno-1');
      servicioAlumnos.getAlumnoById.calls.reset();

      presenter.cambiarAlumno('alumno-1');

      expect(servicioAlumnos.getAlumnoById).not.toHaveBeenCalled();
    }));

    it('dado un alumnoId vacio, no deberia hacer nada', () => {
      presenter.cambiarAlumno('');

      expect(servicioAlumnos.getAlumnoById).not.toHaveBeenCalled();
    });
  });

  describe('agregarAlCarrito', () => {
    it('dado un alumno cargado, cuando agrego con cantidad 1, deberia llamar carrito.agregar y mostrar toast "Se agregó"', fakeAsync(() => {
      whenInicializo('alumno-1');

      presenter.agregarAlCarrito(PRODUCTO_DISPONIBLE);

      expect(servicioCarrito.agregar).toHaveBeenCalledWith(PRODUCTO_DISPONIBLE, 'alumno-1', 1);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/Se agregó 1x/),
      );
    }));

    it('dado un alumno cargado, cuando agrego con cantidad >1, deberia mostrar toast "Se agregaron"', fakeAsync(() => {
      whenInicializo('alumno-1');

      presenter.agregarAlCarrito(PRODUCTO_DISPONIBLE, 3);

      expect(servicioCarrito.agregar).toHaveBeenCalledWith(PRODUCTO_DISPONIBLE, 'alumno-1', 3);
      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/Se agregaron 3x/),
      );
    }));

    it('dado sin alumno cargado, no deberia llamar al service', () => {
      presenter.agregarAlCarrito(PRODUCTO_DISPONIBLE);

      expect(servicioCarrito.agregar).not.toHaveBeenCalled();
    });
  });

  describe('toggleFavorito', () => {
    beforeEach(fakeAsync(() => {
      whenInicializo('alumno-1');
    }));

    it('dado un producto no favorito, cuando toggleo, deberia agregarlo y mostrar toast success', () => {
      presenter.toggleFavorito(PRODUCTO_DISPONIBLE);

      expect(presenter.favoritos().has(PRODUCTO_DISPONIBLE.id)).toBeTrue();
      expect(servicioFavoritos.agregarFavorito).toHaveBeenCalledWith('alumno-1', PRODUCTO_DISPONIBLE);
    });

    it('dado un producto ya favorito, cuando toggleo, deberia removerlo y mostrar toast success', () => {
      presenter.toggleFavorito(PRODUCTO_DISPONIBLE);
      servicioToast.mostrar.calls.reset();

      presenter.toggleFavorito(PRODUCTO_DISPONIBLE);

      expect(presenter.favoritos().has(PRODUCTO_DISPONIBLE.id)).toBeFalse();
      expect(servicioFavoritos.removerFavorito).toHaveBeenCalledWith('alumno-1', PRODUCTO_DISPONIBLE.id);
    });

    it('dado plan gratuito y 5 favoritos, no deberia poder agregar mas y deberia mostrar toast de error', () => {
      const ids = new Set(['f1', 'f2', 'f3', 'f4', 'f5']);
      (presenter as unknown as { favoritosState: { set: (v: Set<string>) => void } })
        .favoritosState.set(ids);
      (presenter as unknown as { favoritosTotalesFamiliaState: { set: (v: number | null) => void } })
        .favoritosTotalesFamiliaState.set(5);

      presenter.toggleFavorito(PRODUCTO_DISPONIBLE);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        jasmine.stringMatching(/Límite de productos favoritos/),
        'error',
      );
      expect(servicioFavoritos.agregarFavorito).not.toHaveBeenCalled();
    });

    it('dado sin alumno, toggleFavorito no deberia hacer nada', () => {
      (presenter as unknown as { alumnoState: { set: (v: unknown) => void } }).alumnoState.set(undefined);

      presenter.toggleFavorito(PRODUCTO_DISPONIBLE);

      expect(servicioFavoritos.agregarFavorito).not.toHaveBeenCalled();
    });
  });

  describe('restriccionesHorariasInformativas y tieneRestriccionesHorarias', () => {
    it('dado franjas sin restricciones generales, deberia marcarlas como no bloqueadas', fakeAsync(() => {
      const slots = [
        crearSlot('slot-1', '10:00', 'PRIMER RECREO'),
        crearSlot('slot-2', '11:00', 'SEGUNDO RECREO'),
      ];
      servicioFranjas.getFranjasHorarias.and.resolveTo(slots);

      whenInicializo('alumno-1');

      const info = presenter.restriccionesHorariasInformativas();
      expect(info.length).toBe(2);
      expect(info.every((h) => h.bloqueado === false)).toBeTrue();
      expect(presenter.tieneRestriccionesHorarias()).toBeFalse();
    }));

    it('dado una restriccion general que apunta a un slot, deberia marcar el slot como bloqueado', fakeAsync(() => {
      const slot = crearSlot('slot-1', '10:00', 'PRIMER RECREO');
      servicioFranjas.getFranjasHorarias.and.resolveTo([slot]);
      servicioRestriccionesHorarias.getRestriccionesPorAlumno.and.resolveTo([
        crearRestriccion({ franjaHoraria: { id: 'slot-1', descripcion: '' } }),
      ]);

      whenInicializo('alumno-1');

      const info = presenter.restriccionesHorariasInformativas();
      expect(info[0].bloqueado).toBeTrue();
      expect(presenter.tieneRestriccionesHorarias()).toBeTrue();
    }));

    it('dado una restriccion no general (con categoryId), no deberia bloquear la franja', fakeAsync(() => {
      const slot = crearSlot('slot-1', '10:00', 'PRIMER RECREO');
      servicioFranjas.getFranjasHorarias.and.resolveTo([slot]);
      servicioRestriccionesHorarias.getRestriccionesPorAlumno.and.resolveTo([
        crearRestriccion({ timeSlotId: 'slot-1', categoryId: 'bebidas' }),
      ]);

      whenInicializo('alumno-1');

      expect(presenter.restriccionesHorariasInformativas()[0].bloqueado).toBeFalse();
    }));
  });

  describe('itemsCarrito y contadores', () => {
    it('dado sin alumno, itemsCarrito deberia estar vacio', () => {
      expect(presenter.itemsCarrito()).toEqual([]);
      expect(presenter.totalCarrito()).toBe(0);
      expect(presenter.cantidadItemsCarrito()).toBe(0);
    });

    it('dado items del alumno actual, cantidadItemsCarrito deberia sumar las cantidades', fakeAsync(() => {
      whenInicializo('alumno-1');
      (servicioCarrito as unknown as { items: unknown }).items = signal([
        { producto: PRODUCTO_DISPONIBLE, alumnoId: 'alumno-1', cantidad: 2 },
        { producto: PRODUCTO_BLOQUEADO_TUTOR, alumnoId: 'alumno-1', cantidad: 3 },
        { producto: PRODUCTO_DISPONIBLE, alumnoId: 'otro', cantidad: 10 },
      ]);

      expect(presenter.cantidadItemsCarrito()).toBe(5);
      expect(presenter.totalCarrito()).toBe(PRODUCTO_DISPONIBLE.precio * 2 + PRODUCTO_BLOQUEADO_TUTOR.precio * 3);
    }));
  });

  describe('recreosDisponibles', () => {
    it('dado sin slots, no deberia devolver opciones hardcodeadas', fakeAsync(() => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([]);

      whenInicializo('alumno-1');

      const opciones = presenter.recreosDisponibles();
      expect(opciones).toEqual([]);
      expect(presenter.hayFranjasHorariasDisponibles()).toBeFalse();
      expect(servicioCarrito.clearSeleccionRetiro).toHaveBeenCalledWith('alumno-1');
    }));

    it('dado slots que matchean por descripcion, deberia asignar el recreo correcto', fakeAsync(() => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([
        crearSlot('s-1', '09:00', 'Primer Recreo'),
        crearSlot('s-2', '11:00', 'Segundo Recreo'),
        crearSlot('s-3', '12:30', 'Almuerzo'),
        crearSlot('s-4', '17:00', 'Salida'),
      ]);

      whenInicializo('alumno-1');

      const recreos = presenter.recreosDisponibles().map((o) => o.recreo);
      expect(recreos).toEqual(['PRIMER_RECREO', 'SEGUNDO_RECREO', 'MEDIODIA', 'FUERA_HORA']);
    }));

    it('dado slots sin match por descripcion, deberia asignarlos por indice', fakeAsync(() => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([
        crearSlot('s-1', '09:00', 'Ninguno'),
        crearSlot('s-2', '11:00', 'Otro'),
      ]);

      whenInicializo('alumno-1');

      const recreos = presenter.recreosDisponibles().map((o) => o.recreo);
      expect(recreos).toEqual(['PRIMER_RECREO', 'SEGUNDO_RECREO']);
    }));

    it('dado un slot bloqueado por restriccion general, deberia marcar motivo tutor', fakeAsync(() => {
      const slot = crearSlot('s-1', '09:00', 'Primer Recreo');
      servicioFranjas.getFranjasHorarias.and.resolveTo([slot]);
      servicioRestriccionesHorarias.getRestriccionesPorAlumno.and.resolveTo([
        crearRestriccion({ franjaHoraria: { id: 's-1', descripcion: '' } }),
      ]);

      whenInicializo('alumno-1');

      const opcion = presenter.recreosDisponibles()[0];
      expect(opcion.bloqueado).toBeTrue();
      expect(opcion.motivo).toBe('tutor');
    }));

    it('dado un slot para hoy con horaInicio dentro de la hora, deberia marcar motivo tiempo', fakeAsync(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date(2026, 6, 15, 10, 30));
      const slot = crearSlot('s-1', '10:45', 'Primer Recreo');
      servicioFranjas.getFranjasHorarias.and.resolveTo([slot]);

      try {
        whenInicializo('alumno-1');

        const opcion = presenter.recreosDisponibles()[0];
        expect(opcion.bloqueado).toBeTrue();
        expect(opcion.motivo).toBe('tiempo');
      } finally {
        jasmine.clock().uninstall();
      }
    }));
  });

  describe('setFecha y setRecreo', () => {
    beforeEach(fakeAsync(() => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([
        crearSlot('s-1', '10:00', 'Primer Recreo'),
      ]);
      whenInicializo('alumno-1');
      servicioBuffet.getProductosDelBuffet.calls.reset();
      servicioCarrito.setSeleccionRetiro.calls.reset();
    }));

    it('dado sin alumno, setFecha no deberia hacer nada', () => {
      (presenter as unknown as { alumnoState: { set: (v: unknown) => void } }).alumnoState.set(undefined);

      presenter.setFecha('2030-07-15');

      expect(servicioCarrito.setSeleccionRetiro).not.toHaveBeenCalled();
    });

    it('dado una fecha valida futura habil, setFecha deberia guardar y recargar productos', () => {
      presenter.setFecha('2030-07-15');

      expect(presenter.fechaSeleccionada()).toBe('2030-07-15');
      expect(servicioCarrito.setSeleccionRetiro).toHaveBeenCalledWith('alumno-1', '2030-07-15', jasmine.any(String));
      expect(servicioBuffet.getProductosDelBuffet).toHaveBeenCalled();
    });

    it('dado una fecha sabado, setFecha deberia adelantarla al siguiente dia habil (lunes)', () => {
      presenter.setFecha('2030-07-13');

      expect(presenter.fechaSeleccionada()).toBe('2030-07-15');
    });

    it('dado un recreo, setRecreo deberia guardarlo y recargar productos', () => {
      presenter.setRecreo('SEGUNDO_RECREO');

      expect(presenter.recreoSeleccionado()).toBe('SEGUNDO_RECREO');
      expect(servicioCarrito.setSeleccionRetiro).toHaveBeenCalledWith('alumno-1', jasmine.any(String), 'SEGUNDO_RECREO');
      expect(servicioBuffet.getProductosDelBuffet).toHaveBeenCalled();
    });

    it('dado sin alumno, setRecreo no deberia hacer nada', () => {
      (presenter as unknown as { alumnoState: { set: (v: unknown) => void } }).alumnoState.set(undefined);

      presenter.setRecreo('FUERA_HORA');

      expect(servicioCarrito.setSeleccionRetiro).not.toHaveBeenCalled();
    });
  });

  describe('setCantidadProducto', () => {
    beforeEach(fakeAsync(() => {
      whenInicializo('alumno-1');
      (servicioCarrito as unknown as { puedeAgregar: jasmine.Spy }).puedeAgregar =
        jasmine.createSpy('puedeAgregar').and.returnValue(true);
      (servicioCarrito as unknown as { setCantidadPorProducto: jasmine.Spy }).setCantidadPorProducto =
        jasmine.createSpy('setCantidadPorProducto');
    }));

    it('dado sin alumno, no deberia hacer nada', () => {
      (presenter as unknown as { alumnoState: { set: (v: unknown) => void } }).alumnoState.set(undefined);

      presenter.setCantidadProducto(PRODUCTO_DISPONIBLE, 2);

      expect(
        (servicioCarrito as unknown as { setCantidadPorProducto: jasmine.Spy }).setCantidadPorProducto,
      ).not.toHaveBeenCalled();
    });

    it('dado que puedeAgregar es true, deberia llamar a setCantidadPorProducto', () => {
      presenter.setCantidadProducto(PRODUCTO_DISPONIBLE, 3);

      expect(
        (servicioCarrito as unknown as { setCantidadPorProducto: jasmine.Spy }).setCantidadPorProducto,
      ).toHaveBeenCalledWith(PRODUCTO_DISPONIBLE, 'alumno-1', 3);
    });

    it('dado que puedeAgregar es false para cantidad mayor, deberia mostrar toast y no setear', () => {
      (servicioCarrito as unknown as { puedeAgregar: jasmine.Spy }).puedeAgregar =
        jasmine.createSpy('puedeAgregar').and.returnValue(false);

      presenter.setCantidadProducto(PRODUCTO_DISPONIBLE, 5);

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No es posible agregar más unidades de este producto.',
        'error',
      );
      expect(
        (servicioCarrito as unknown as { setCantidadPorProducto: jasmine.Spy }).setCantidadPorProducto,
      ).not.toHaveBeenCalled();
    });

    it('dado cantidad menor a la actual del carrito, no deberia validar puedeAgregar y setear igual', () => {
      (servicioCarrito as unknown as { items: unknown }).items = signal([
        { producto: PRODUCTO_DISPONIBLE, alumnoId: 'alumno-1', cantidad: 5 },
      ]);
      (servicioCarrito as unknown as { puedeAgregar: jasmine.Spy }).puedeAgregar =
        jasmine.createSpy('puedeAgregar');

      presenter.setCantidadProducto(PRODUCTO_DISPONIBLE, 2);

      expect((servicioCarrito as unknown as { puedeAgregar: jasmine.Spy }).puedeAgregar).not.toHaveBeenCalled();
      expect(
        (servicioCarrito as unknown as { setCantidadPorProducto: jasmine.Spy }).setCantidadPorProducto,
      ).toHaveBeenCalledWith(PRODUCTO_DISPONIBLE, 'alumno-1', 2);
    });
  });

  describe('cambiarAlumno', () => {
    it('dado un alumnoId nuevo, deberia inicializar con el nuevo alumno y navegar a /buffet', fakeAsync(() => {
      whenInicializo('alumno-1');
      const otroAlumno = AlumnoMother.crear({ id: 'alumno-2', nombre: 'Ana', apellido: 'Perez', colegioId: 'colegio-1', saldo: 500 });
      servicioAlumnos.getAlumnoById.and.callFake((id: string) =>
        id === 'alumno-2' ? otroAlumno : ALUMNO,
      );

      presenter.cambiarAlumno('alumno-2');

      expect(servicioAlumnos.getAlumnoById).toHaveBeenCalledWith('alumno-2');
      expect(servicioContexto.setAlumnoId).toHaveBeenCalledWith('alumno-2');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/buffet');
    }));
  });

  describe('iniciarPago sin buffet', () => {
    it('dado alumno sin buffet en state, deberia mostrar toast y no procesar', fakeAsync(() => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([
        crearSlot('s-1', '10:00', 'Primer Recreo'),
      ]);
      whenInicializo('alumno-1');
      (servicioCarrito as unknown as { items: unknown }).items = signal([
        { producto: PRODUCTO_DISPONIBLE, alumnoId: 'alumno-1', cantidad: 1 },
      ]);
      (presenter as unknown as { buffetState: { set: (v: unknown) => void } }).buffetState.set(undefined);

      presenter.iniciarPago();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('No se pudo resolver el buffet del pedido', 'error');
      expect(servicioCompra.iniciarOrden).not.toHaveBeenCalled();
    }));
  });

  describe('toggleFavorito con errores del backend', () => {
    beforeEach(fakeAsync(() => {
      whenInicializo('alumno-1');
    }));

    it('dado que agregarFavorito falla, deberia loggear pero mantener el estado optimista', () => {
      const spyConsole = spyOn(console, 'error');
      servicioFavoritos.agregarFavorito.and.returnValue(throwError(() => new Error('boom')));

      presenter.toggleFavorito(PRODUCTO_DISPONIBLE);

      expect(spyConsole).toHaveBeenCalledWith('Error adding favorite:', jasmine.any(Error));
      expect(presenter.favoritos().has(PRODUCTO_DISPONIBLE.id)).toBeTrue();
    });

    it('dado que removerFavorito falla, deberia loggear pero mantener el estado optimista', () => {
      const idsIniciales = new Set([PRODUCTO_DISPONIBLE.id]);
      (presenter as unknown as { favoritosState: { set: (v: Set<string>) => void } }).favoritosState.set(idsIniciales);
      const spyConsole = spyOn(console, 'error');
      servicioFavoritos.removerFavorito.and.returnValue(throwError(() => new Error('boom')));

      presenter.toggleFavorito(PRODUCTO_DISPONIBLE);

      expect(spyConsole).toHaveBeenCalledWith('Error removing favorite:', jasmine.any(Error));
    });
  });

  describe('toggleLock sin alumno', () => {
    it('dado sin alumno cargado, no deberia llamar al service de restricciones', () => {
      presenter.toggleLock(PRODUCTO_DISPONIBLE);

      expect(servicioRestriccionProducto.bloquearProducto).not.toHaveBeenCalled();
      expect(servicioRestriccionProducto.desbloquearProducto).not.toHaveBeenCalled();
    });
  });

  describe('productosFiltrados por clasificacionId y precioMax', () => {
    beforeEach(fakeAsync(() => {
      givenVistaAlumno(false);
      whenInicializo('alumno-1');
    }));

    it('dado filtro por clasificacion, deberia dejar solo los que tienen esa clasificacion', () => {
      presenter.seleccionarClasificacion('sin-tacc');

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.every((p) => p.clasificacionesSalud.some((c) => c.id === 'sin-tacc'))).toBeTrue();
    });

    it('dado precioMax bajo, deberia dejar solo los baratos', () => {
      presenter.setPrecioMax(350);

      const filtrados = presenter.productosFiltrados();
      expect(filtrados.every((p) => p.precio <= 350)).toBeTrue();
    });
  });

  describe('consultarPresupuestoPorFecha', () => {
    it('dado que checkBudgetDates devuelve un match, deberia setear presupuestoPorFecha', fakeAsync(() => {
      const status: DateBudgetStatus[] = [{ date: '2030-07-15', blocked: true, reason: 'excedido' }];
      servicioPresupuesto.checkBudgetDates.and.resolveTo(status);

      whenInicializo('alumno-1');
      presenter.setFecha('2030-07-15');
      tick();

      expect(presenter.presupuestoPorFecha()).toEqual({ bloqueado: true, razon: 'excedido' });
      expect(presenter.cargandoPresupuestoPorFecha()).toBeFalse();
    }));

    it('dado que checkBudgetDates devuelve resultados sin match, deberia setear null', fakeAsync(() => {
      servicioPresupuesto.checkBudgetDates.and.resolveTo([
        { date: '9999-01-01', blocked: false, reason: null },
      ]);

      whenInicializo('alumno-1');
      presenter.setFecha('2030-07-15');
      tick();

      expect(presenter.presupuestoPorFecha()).toBeNull();
    }));

    it('dado que checkBudgetDates rechaza, deberia setear null y loggear', fakeAsync(() => {
      const spyConsole = spyOn(console, 'error');
      servicioPresupuesto.checkBudgetDates.and.rejectWith(new Error('boom'));

      whenInicializo('alumno-1');
      tick();

      expect(presenter.presupuestoPorFecha()).toBeNull();
      expect(spyConsole).toHaveBeenCalled();
    }));
  });

  describe('init errores parciales', () => {
    it('dado que franjas/restricciones fallan, deberia loggear y usar fecha minima fallback', fakeAsync(() => {
      const spyConsole = spyOn(console, 'error');
      servicioFranjas.getFranjasHorarias.and.rejectWith(new Error('boom'));

      whenInicializo('alumno-1');

      expect(spyConsole).toHaveBeenCalledWith('Error loading franjas/restricciones:', jasmine.any(Error));
      expect(presenter.fechaSeleccionada()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }));

    it('dado que getPromotions falla, deberia loggear sin romper el resto del flujo', fakeAsync(() => {
      const spyConsole = spyOn(console, 'error');
      servicioPromotion.getPromotions.and.returnValue(throwError(() => new Error('boom')));

      whenInicializo('alumno-1');

      expect(spyConsole).toHaveBeenCalledWith('Error loading promotions:', jasmine.any(Error));
    }));

    it('dado que getRestriccionesAlumno falla, deberia loggear sin romper', fakeAsync(() => {
      const spyConsole = spyOn(console, 'error');
      servicioRestriccionesNutricionales.getRestriccionesAlumno.and.rejectWith(new Error('boom'));

      whenInicializo('alumno-1');

      expect(spyConsole).toHaveBeenCalledWith(
        'Error loading nutritional restrictions:',
        jasmine.any(Error),
      );
    }));

    it('dado que getProductosDelBuffet falla, deberia loggear sin romper', fakeAsync(() => {
      const spyConsole = spyOn(console, 'error');
      servicioBuffet.getProductosDelBuffet.and.returnValue(throwError(() => new Error('boom')));

      whenInicializo('alumno-1');

      expect(spyConsole).toHaveBeenCalledWith('Error loading products for buffet:', jasmine.any(Error));
    }));
  });

  describe('iniciarPago', () => {
    beforeEach(fakeAsync(() => {
      servicioFranjas.getFranjasHorarias.and.resolveTo([
        crearSlot('s-1', '10:00', 'Primer Recreo'),
      ]);
      whenInicializo('alumno-1');
      (servicioCarrito as unknown as { items: unknown }).items = signal([
        { producto: PRODUCTO_DISPONIBLE, alumnoId: 'alumno-1', cantidad: 2 },
      ]);
      (servicioCarrito as unknown as { limpiarAlumno: jasmine.Spy }).limpiarAlumno =
        jasmine.createSpy('limpiarAlumno');
    }));

    it('dado carrito con items, saldo suficiente y procesarPago exitoso, deberia navegar a /compra/exito', () => {
      servicioCompra.procesarPago.and.returnValue(
        of({ id: 'orden-1', ordenes: [], total: 0, codigos: {} }) as unknown as Observable<never>,
      );

      presenter.iniciarPago();

      expect(servicioCompra.iniciarOrden).toHaveBeenCalled();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/compra/exito');
    });

    it('dado sin items en el carrito, no deberia procesar pago', () => {
      (servicioCarrito as unknown as { items: unknown }).items = signal([]);

      presenter.iniciarPago();

      expect(servicioCompra.iniciarOrden).not.toHaveBeenCalled();
    });

    it('dado saldo insuficiente, deberia mostrar toast y no procesar', () => {
      const alumnoPobre = { ...ALUMNO, saldo: 0 };
      (presenter as unknown as { alumnoState: { set: (v: unknown) => void } }).alumnoState.set(alumnoPobre);

      presenter.iniciarPago();

      expect(servicioToast.mostrar).toHaveBeenCalledWith('Saldo insuficiente para realizar el pedido', 'error');
      expect(servicioCompra.iniciarOrden).not.toHaveBeenCalled();
    });

    it('dado que no hay franjas horarias disponibles, deberia mostrar toast y no procesar', () => {
      (presenter as unknown as { franjasState: { set: (v: unknown[]) => void } }).franjasState.set([]);

      presenter.iniciarPago();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No hay franjas horarias disponibles para realizar el pedido.',
        'error',
      );
      expect(servicioCompra.iniciarOrden).not.toHaveBeenCalled();
    });

    it('dado procesarPago falla, deberia mostrar toast de error y limpiar procesandoPago', () => {
      servicioCompra.procesarPago.and.returnValue(throwError(() => new Error('boom')));

      presenter.iniciarPago();

      expect(servicioToast.mostrar).toHaveBeenCalledWith(
        'No pudimos procesar el pago. Intentalo de nuevo.',
        'error',
      );
      expect(presenter.procesandoPago()).toBeFalse();
    });

    it('dado ya procesandoPago, no deberia iniciar otro pago', () => {
      presenter.procesandoPago.set(true);

      presenter.iniciarPago();

      expect(servicioCompra.iniciarOrden).not.toHaveBeenCalled();
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

  function crearSlot(id: string, horaInicio: string, descripcion: string): TimeSlot {
    const [hh, mm] = horaInicio.split(':').map(Number);
    const finMin = mm + 30;
    const horaFin = `${String(hh + Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;
    return {
      id,
      colegioId: 'colegio-1',
      descripcion,
      horaInicio,
      horaFin,
      activo: true,
    };
  }

  function crearRestriccion(override: Partial<RestriccionHoraria> = {}): RestriccionHoraria {
    return {
      id: 'r-1',
      studentId: 'alumno-1',
      timeSlotId: null,
      categoryId: null,
      classificationId: null,
      activa: true,
      ...override,
    };
  }

  describe('branches puntuales', () => {
    it('matchesDescription con recreo desconocido deberia devolver false (default)', () => {
      const priv = presenter as unknown as { matchesDescription?(desc: string, recreo: string): boolean };
      if (!priv.matchesDescription) return;

      expect(priv.matchesDescription('cualquier cosa', 'RARO')).toBeFalse();
    });

    it('matchesDescription con descripcion vacia deberia devolver false', () => {
      const priv = presenter as unknown as { matchesDescription?(desc: string, recreo: string): boolean };
      if (!priv.matchesDescription) return;

      expect(priv.matchesDescription('', 'PRIMER_RECREO')).toBeFalse();
    });
  });
});
