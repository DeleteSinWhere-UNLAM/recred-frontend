import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BuffetPage } from './buffet.page';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { BuffetPresenter } from './presenter/buffet.presenter';
import { RolUsuario } from '../../data-access/models/perfil.model';
import { FranjaMother, FranjaTest } from './buffet.mother';

interface PresenterMockShape {
  init: jasmine.Spy;
  buscar: jasmine.Spy;
  seleccionarCategoria: jasmine.Spy;
  seleccionarClasificacion: jasmine.Spy;
  toggleSoloFavoritos: jasmine.Spy;
  setPrecioMin: jasmine.Spy;
  setPrecioMax: jasmine.Spy;
  cambiarAlumno: jasmine.Spy;
  setFecha: jasmine.Spy;
  setRecreo: jasmine.Spy;
  agregarAlCarrito: jasmine.Spy;
  setCantidadProducto: jasmine.Spy;
  fechaSeleccionada: ReturnType<typeof signal<string | null>>;
  fechaMinima: ReturnType<typeof signal<string>>;
  saldo: ReturnType<typeof signal<number>>;
  franjas: ReturnType<typeof signal<FranjaTest[]>>;
  promociones: ReturnType<typeof signal<unknown[]>>;
  productos: ReturnType<typeof signal<unknown[]>>;
  productosFiltrados: ReturnType<typeof signal<unknown[]>>;
  filtros: ReturnType<typeof signal<{ busqueda: string; categoriaId: string; precioMin: number | null; precioMax: number | null }>>;
  itemsCarrito: ReturnType<typeof signal<unknown[]>>;
  alumno: ReturnType<typeof signal<unknown>>;
  presupuestoDisponible: ReturnType<typeof signal<unknown>>;
  restriccionesHorariasInformativas: ReturnType<typeof signal<unknown[]>>;
  restriccionesNutricionales: ReturnType<typeof signal<unknown[]>>;
}

interface PageProtegida {
  homeUrlPorRol: () => string;
  onBusqueda: (e: Event) => void;
  onCategoria: (e: Event) => void;
  onClasificacion: (e: Event) => void;
  onToggleSoloFavoritos: () => void;
  onPrecioMinCambia: (e: Event) => void;
  onPrecioMaxCambia: (e: Event) => void;
  abrirSelector: () => void;
  cerrarSelector: () => void;
  mostrarSelector: () => boolean;
  onAlumnoSeleccionado: (id: string) => void;
  onFechaCambia: (e: Event) => void;
  onRecreoCambia: (e: Event) => void;
  saldoFormateado: string;
  formatARS: (n: number) => string;
  formatFecha: (s: string) => string;
  nombreMesCalendario: () => string;
  generateCalendar: (s: string) => void;
  diasCalendario: () => { fechaStr: string; bloqueado: boolean; esFinDeSemana: boolean }[];
  seleccionarDiaCalendario: (c: { fechaStr: string; bloqueado: boolean }) => void;
  obtenerRangoHorario: (recreo: string) => string;
  getCategoryIcon: (desc: string) => string;
  esPromocion: (p: unknown) => boolean;
  promoComoProducto: (p: unknown) => unknown;
  puedeComprarPromo: (p: unknown) => boolean;
  getMensajeRestriccionPromo: (p: { motivoBloqueo?: string }) => string;
  agregarPromoAlCarrito: (p: unknown) => void;
  onAgregarAlCarrito: (p: unknown, cantidad: number) => void;
  obtenerCantidadEnCarrito: (id: string) => number;
  presupuestoInfo: () => { hasBudget: boolean; periodo: string; montoLimite: number };
  hayCombosEnCarrito: () => boolean;
  tieneRestriccionesActivas: () => boolean;
  abrirModalFavorito: () => void;
  cerrarModalFavorito: () => void;
  mostrarModalFavorito: boolean;
  favoritoModalItems: unknown[];
  panelLateralCerrado: () => boolean;
  isAtStart: () => boolean;
  isAtEnd: () => boolean;
  promocionesDestacadas: () => unknown[];
  promocionesDestacadasFiltradas: () => unknown[];
  productosSueltos: () => unknown[];
}

describe('BuffetPage', () => {
  let component: BuffetPage;
  let fixture: ComponentFixture<BuffetPage>;

  let servicioUsuario: jasmine.SpyObj<UsuarioService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;
  let servicioColegios: jasmine.SpyObj<ColegiosService>;
  let presenter: PresenterMockShape;

  beforeEach(async () => {
    const rutaMock = {
      snapshot: { paramMap: { get: () => 'a1' } },
    };
    servicioUsuario = jasmine.createSpyObj('UsuarioService', ['setHomeUrl'], {
      nombreNavbar: 'Juan',
      esVistaAlumno: signal(false),
    });
    servicioPerfil = jasmine.createSpyObj('PerfilService', ['rol']);
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados'], {
      alumnos: signal([{ id: 'a1', nombre: 'Juan' }]),
    });
    servicioColegios = jasmine.createSpyObj('ColegiosService', ['getColegios']);

    presenter = crearPresenterMock();

    servicioPerfil.rol.and.returnValue('PADRE');
    servicioAlumnos.asegurarCargados.and.resolveTo([]);
    servicioColegios.getColegios.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [BuffetPage],
      providers: [
        { provide: ActivatedRoute, useValue: rutaMock },
        { provide: UsuarioService, useValue: servicioUsuario },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: AlumnosService, useValue: servicioAlumnos },
        { provide: ColegiosService, useValue: servicioColegios },
        { provide: AlumnoContextoService, useValue: { alumnoId: signal('a1') } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(BuffetPage, {
        set: {
          template: '',
          providers: [{ provide: BuffetPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BuffetPage);
    component = fixture.componentInstance;
  });

  it('dado que se monta la pagina, deberia setear homeUrl, asegurarCargados y delegar init al presenter', fakeAsync(() => {
    whenMontoLaPagina();

    expect(component).toBeTruthy();
    expect(servicioUsuario.setHomeUrl).toHaveBeenCalledWith('/tutor');
    expect(servicioAlumnos.asegurarCargados).toHaveBeenCalledWith(true);
    expect(presenter.init).toHaveBeenCalledWith('a1');
  }));

  it('dado un rol, cuando leo homeUrlPorRol, deberia mapear al home correspondiente', () => {
    givenRol('ALUMNO');
    expect(page().homeUrlPorRol()).toBe('/alumno');

    givenRol('VENDEDOR');
    expect(page().homeUrlPorRol()).toBe('/kiosquero');

    givenRol(null);
    expect(page().homeUrlPorRol()).toBe('/tutor');
  });

  it('dado que asegurarCargados falla, cuando monto la pagina, deberia loggear el error pero igual inicializar el presenter', fakeAsync(() => {
    const errorSpy = spyOn(console, 'error');
    servicioAlumnos.asegurarCargados.and.rejectWith('Error de red');

    whenMontoLaPagina();

    expect(errorSpy).toHaveBeenCalledWith('Error al cargar alumnos para el buffet:', 'Error de red');
    expect(presenter.init).toHaveBeenCalledWith('a1');
  }));

  describe('Interacciones en el DOM', () => {
    it('dado un input de busqueda, cuando dispara onBusqueda, deberia delegar al presenter', () => {
      whenInput('onBusqueda', 'texto');

      expect(presenter.buscar).toHaveBeenCalledWith('texto');
    });

    it('dado un select de categoria, cuando dispara onCategoria, deberia delegar al presenter', () => {
      whenInput('onCategoria', 'cat1');

      expect(presenter.seleccionarCategoria).toHaveBeenCalledWith('cat1');
    });

    it('dado un select de clasificacion, cuando dispara onClasificacion, deberia delegar al presenter', () => {
      whenInput('onClasificacion', 'clas1');

      expect(presenter.seleccionarClasificacion).toHaveBeenCalledWith('clas1');
    });

    it('dado el toggle de solo favoritos, cuando se dispara, deberia delegar al presenter', () => {
      page().onToggleSoloFavoritos();

      expect(presenter.toggleSoloFavoritos).toHaveBeenCalled();
    });

    it('dado los inputs de precio, cuando cambian, deberia delegar al presenter parseando o null si vacio', () => {
      whenInput('onPrecioMinCambia', '10');
      expect(presenter.setPrecioMin).toHaveBeenCalledWith(10);

      whenInput('onPrecioMaxCambia', '20');
      expect(presenter.setPrecioMax).toHaveBeenCalledWith(20);

      whenInput('onPrecioMinCambia', '');
      expect(presenter.setPrecioMin).toHaveBeenCalledWith(null);
    });

    it('dado el selector cerrado, cuando lo abro y luego lo cierro, deberia reflejar el estado en el signal', () => {
      page().abrirSelector();
      expect(page().mostrarSelector()).toBeTrue();

      page().cerrarSelector();
      expect(page().mostrarSelector()).toBeFalse();
    });

    it('dado un alumno seleccionado, cuando lo elijo en el modal, deberia cerrarlo y delegar al presenter', () => {
      page().onAlumnoSeleccionado('a2');

      expect(page().mostrarSelector()).toBeFalse();
      expect(presenter.cambiarAlumno).toHaveBeenCalledWith('a2');
    });

    it('dado un input de fecha, cuando cambia, deberia delegar al presenter', () => {
      whenInput('onFechaCambia', '2024-06-01');

      expect(presenter.setFecha).toHaveBeenCalledWith('2024-06-01');
    });

    it('dado un select de recreo, cuando cambia, deberia delegar al presenter', () => {
      whenInput('onRecreoCambia', 'MEDIODIA');

      expect(presenter.setRecreo).toHaveBeenCalledWith('MEDIODIA');
    });
  });

  describe('Formateadores y UI getters', () => {
    it('dado un saldo, cuando consulto saldoFormateado, deberia contener las partes del numero', () => {
      expect(page().saldoFormateado).toContain('1');
      expect(page().saldoFormateado).toContain('500');
    });

    it('dado un monto, cuando lo formateo con formatARS, deberia contener el numero', () => {
      expect(page().formatARS(2000)).toContain('2');
    });

    it('dado una fecha ISO, cuando la formateo, deberia devolver dd/mm/yyyy y vacio si esta vacia', () => {
      expect(page().formatFecha('2024-05-10')).toBe('10/05/2024');
      expect(page().formatFecha('')).toBe('');
    });

    it('dado una fecha seleccionada, cuando consulto el nombre del mes, deberia devolver el mes en texto', () => {
      presenter.fechaSeleccionada.set('2024-05-10');
      expect(page().nombreMesCalendario().toLowerCase()).toContain('mayo');

      presenter.fechaSeleccionada.set(null);
      expect(page().nombreMesCalendario()).toBe('');
    });
  });

  describe('Logica del Calendario', () => {
    it('dado una fecha de referencia, cuando genero el calendario, deberia armar 42 dias con flags de bloqueado y fin de semana', () => {
      page().generateCalendar('2024-05-10');
      const dias = page().diasCalendario();

      expect(dias.length).toBe(42);
      expect(dias.find((d) => d.fechaStr === '2024-05-01')).toBeTruthy();

      const bloqueadoAnterior = dias.find((d) => d.fechaStr === '2024-04-30');
      if (bloqueadoAnterior) expect(bloqueadoAnterior.bloqueado).toBeTrue();

      const finDeSemana = dias.find((d) => d.fechaStr === '2024-05-04');
      if (finDeSemana) {
        expect(finDeSemana.esFinDeSemana).toBeTrue();
        expect(finDeSemana.bloqueado).toBeTrue();
      }
    });

    it('dado una fecha vacia, cuando genero el calendario, deberia dejar la lista vacia', () => {
      page().generateCalendar('');

      expect(page().diasCalendario().length).toBe(0);
    });

    it('dado una celda activa, cuando la selecciono, deberia delegar al presenter; si esta bloqueada, no deberia delegar', () => {
      page().seleccionarDiaCalendario({ bloqueado: false, fechaStr: '2024-05-10' });
      expect(presenter.setFecha).toHaveBeenCalledWith('2024-05-10');

      presenter.setFecha.calls.reset();
      page().seleccionarDiaCalendario({ bloqueado: true, fechaStr: '2024-05-04' });
      expect(presenter.setFecha).not.toHaveBeenCalled();
    });
  });

  describe('obtenerRangoHorario', () => {
    it('dado las franjas default, cuando consulto el rango de cada recreo, deberia devolverlo formateado HH:MM - HH:MM', () => {
      presenter.franjas.set([
        { id: 'f1', descripcion: 'Primer Recreo', horaInicio: '10:00', horaFin: '10:15' },
        { id: 'f2', descripcion: 'Segundo Recreo', horaInicio: '12:00', horaFin: '12:15' },
        { id: 'f3', descripcion: 'Mediodia', horaInicio: '13:00', horaFin: '14:00' },
        { id: 'f4', descripcion: 'Salida', horaInicio: '16:00', horaFin: '16:30' },
      ]);

      expect(page().obtenerRangoHorario('PRIMER_RECREO')).toBe('10:00 - 10:15');
      expect(page().obtenerRangoHorario('SEGUNDO_RECREO')).toBe('12:00 - 12:15');
      expect(page().obtenerRangoHorario('MEDIODIA')).toBe('13:00 - 14:00');
      expect(page().obtenerRangoHorario('FUERA_HORA')).toBe('16:00 - 16:30');
    });

    it('dado que no hay franjas, cuando consulto el rango, deberia devolver string vacio', () => {
      presenter.franjas.set([]);

      expect(page().obtenerRangoHorario('PRIMER_RECREO')).toBe('');
    });

    it('dado franjas con segundos (HH:MM:SS), cuando consulto el rango, deberia recortar los segundos', () => {
      presenter.franjas.set([
        { id: 'f1', descripcion: 'Primer Recreo', horaInicio: '10:00:00', horaFin: '10:15:00' },
      ]);

      expect(page().obtenerRangoHorario('PRIMER_RECREO')).toBe('10:00 - 10:15');
    });
  });

  describe('getCategoryIcon', () => {
    it('dado descripciones de bebidas/jugo/agua/infusion, deberia devolver fa-bottle-water', () => {
      expect(page().getCategoryIcon('Bebidas')).toBe('fa-solid fa-bottle-water');
      expect(page().getCategoryIcon('Jugo natural')).toBe('fa-solid fa-bottle-water');
      expect(page().getCategoryIcon('Agua saborizada')).toBe('fa-solid fa-bottle-water');
      expect(page().getCategoryIcon('Infusion')).toBe('fa-solid fa-bottle-water');
    });

    it('dado descripciones de snack/galletita/papa, deberia devolver fa-cookie-bite', () => {
      expect(page().getCategoryIcon('Snacks')).toBe('fa-solid fa-cookie-bite');
      expect(page().getCategoryIcon('Galletitas')).toBe('fa-solid fa-cookie-bite');
      expect(page().getCategoryIcon('Papas fritas')).toBe('fa-solid fa-cookie-bite');
    });

    it('dado descripciones de golosina/dulce/chocolate/caramelo, deberia devolver fa-candy-cane', () => {
      expect(page().getCategoryIcon('Golosinas')).toBe('fa-solid fa-candy-cane');
      expect(page().getCategoryIcon('Dulces')).toBe('fa-solid fa-candy-cane');
      expect(page().getCategoryIcon('Chocolates')).toBe('fa-solid fa-candy-cane');
    });

    it('dado descripciones de comida/almuerzo/plato/sandwich, deberia devolver fa-hamburger', () => {
      expect(page().getCategoryIcon('Comidas')).toBe('fa-solid fa-hamburger');
      expect(page().getCategoryIcon('Almuerzo')).toBe('fa-solid fa-hamburger');
      expect(page().getCategoryIcon('Sandwich JyQ')).toBe('fa-solid fa-hamburger');
    });

    it('dado categoria vacia o desconocida, deberia devolver fa-utensils por default', () => {
      expect(page().getCategoryIcon('')).toBe('fa-solid fa-utensils');
      expect(page().getCategoryIcon('Otra cosa')).toBe('fa-solid fa-utensils');
    });
  });

  describe('esPromocion', () => {
    it('dado un producto con nombre "Promo X", deberia ser promocion', () => {
      const producto = { nombre: 'Promo desayuno', categoria: { id: 'x', descripcion: 'X' } };

      expect(page().esPromocion(producto)).toBeTrue();
    });

    it('dado un producto con nombre "Combo X", deberia ser promocion', () => {
      const producto = { nombre: 'Combo alfajor + jugo', categoria: { id: 'x', descripcion: 'X' } };

      expect(page().esPromocion(producto)).toBeTrue();
    });

    it('dado un nombre con "duo pack", deberia ser promocion', () => {
      const producto = { nombre: 'Duo Pack Oreo', categoria: { id: 'x', descripcion: 'X' } };

      expect(page().esPromocion(producto)).toBeTrue();
    });

    it('dado una categoria con descripcion combo/promo, deberia ser promocion', () => {
      const producto = { nombre: 'Alfajor', categoria: { id: 'x', descripcion: 'Combos del dia' } };

      expect(page().esPromocion(producto)).toBeTrue();
    });

    it('dado un producto null o sin nombre, no deberia romper', () => {
      expect(page().esPromocion(null as unknown as never)).toBeFalse();
    });

    it('dado un producto comun, no deberia ser promocion', () => {
      const producto = { nombre: 'Agua Mineral', categoria: { id: 'bebidas', descripcion: 'Bebidas' } };

      expect(page().esPromocion(producto)).toBeFalse();
    });
  });

  describe('getMensajeRestriccionPromo', () => {
    it('dado sin motivoBloqueo, deberia devolver "No apto"', () => {
      expect(page().getMensajeRestriccionPromo({})).toBe('No apto');
    });

    it('dado un motivo con Gluten, deberia mapear a "Contiene TACC"', () => {
      const msg = page().getMensajeRestriccionPromo({ motivoBloqueo: 'Contiene: Gluten (TACC)' });

      expect(msg).toContain('Contiene TACC');
    });

    it('dado multiples elementos, deberia unirlos con el separador ·', () => {
      const msg = page().getMensajeRestriccionPromo({
        motivoBloqueo: 'Contiene: Azúcar, Lácteos',
      });

      expect(msg).toContain('Contiene Azúcar');
      expect(msg).toContain('Contiene Lácteos');
      expect(msg).toContain('·');
    });
  });

  describe('presupuestoInfo', () => {
    it('dado sin presupuesto disponible, deberia devolver hasBudget false con el saldo', () => {
      presenter.presupuestoDisponible.set(null);
      presenter.saldo.set(3000);

      const info = page().presupuestoInfo();
      expect(info.hasBudget).toBeFalse();
      expect(info.montoLimite).toBe(3000);
      expect(info.periodo).toBe('General');
    });

    it('dado un presupuesto activo, deberia devolver hasBudget true con los datos del presupuesto', () => {
      presenter.presupuestoDisponible.set({
        activo: true,
        periodo: 'Semanal',
        montoLimiteGeneral: 10000,
        montoConsumidoGeneral: 3000,
        montoDisponibleGeneral: 7000,
        porcentajeConsumidoGeneral: 30,
        reglasCategorias: [],
      });

      const info = page().presupuestoInfo();
      expect(info.hasBudget).toBeTrue();
      expect(info.montoLimite).toBe(10000);
      expect(info.periodo).toBe('Semanal');
    });
  });

  describe('tieneRestriccionesActivas', () => {
    it('dado restricciones nutricionales activas, deberia devolver true', () => {
      presenter.restriccionesNutricionales.set([{ id: 'r1' }]);
      presenter.restriccionesHorariasInformativas.set([]);

      expect(page().tieneRestriccionesActivas()).toBeTrue();
    });

    it('dado horarias bloqueadas, deberia devolver true', () => {
      presenter.restriccionesNutricionales.set([]);
      presenter.restriccionesHorariasInformativas.set([{ descripcion: 'r', bloqueado: true }]);

      expect(page().tieneRestriccionesActivas()).toBeTrue();
    });

    it('dado sin restricciones ni bloqueos, deberia devolver false', () => {
      presenter.restriccionesNutricionales.set([]);
      presenter.restriccionesHorariasInformativas.set([{ descripcion: 'r', bloqueado: false }]);

      expect(page().tieneRestriccionesActivas()).toBeFalse();
    });
  });

  describe('hayCombosEnCarrito', () => {
    it('dado items sin combo, deberia devolver false', () => {
      presenter.itemsCarrito.set([{ producto: { esCombo: false } }]);

      expect(page().hayCombosEnCarrito()).toBeFalse();
    });

    it('dado items con al menos un combo, deberia devolver true', () => {
      presenter.itemsCarrito.set([{ producto: { esCombo: false } }, { producto: { esCombo: true } }]);

      expect(page().hayCombosEnCarrito()).toBeTrue();
    });
  });

  describe('obtenerCantidadEnCarrito', () => {
    it('dado un producto en el carrito, deberia devolver su cantidad', () => {
      presenter.itemsCarrito.set([{ producto: { id: 'p1' }, cantidad: 3 }]);

      expect(page().obtenerCantidadEnCarrito('p1')).toBe(3);
    });

    it('dado un producto que no esta, deberia devolver 0', () => {
      presenter.itemsCarrito.set([{ producto: { id: 'p1' }, cantidad: 3 }]);

      expect(page().obtenerCantidadEnCarrito('desconocido')).toBe(0);
    });
  });

  describe('onAgregarAlCarrito', () => {
    it('dado carrito vacio + panel cerrado + cantidad>0, deberia abrir el panel y delegar al presenter', () => {
      presenter.itemsCarrito.set([]);
      const cmp = component as unknown as { panelLateralCerrado: { set: (v: boolean) => void; (): boolean } };
      cmp.panelLateralCerrado.set(true);

      page().onAgregarAlCarrito({ id: 'p1' }, 2);

      expect(presenter.setCantidadProducto).toHaveBeenCalledWith({ id: 'p1' }, 2);
      expect((cmp.panelLateralCerrado as unknown as () => boolean)()).toBeFalse();
    });

    it('dado carrito con items, no deberia tocar el panel', () => {
      presenter.itemsCarrito.set([{ producto: { id: 'x' }, cantidad: 1 }]);
      const cmp = component as unknown as { panelLateralCerrado: { set: (v: boolean) => void; (): boolean } };
      cmp.panelLateralCerrado.set(true);

      page().onAgregarAlCarrito({ id: 'p1' }, 2);

      expect((cmp.panelLateralCerrado as unknown as () => boolean)()).toBeTrue();
    });
  });

  describe('agregarPromoAlCarrito', () => {
    it('dado sin alumno, no deberia agregar', () => {
      presenter.alumno.set(null);
      const promo = { id: 'promo-1', nombre: 'X', precio: 100, imagen: '', descripcion: '', categoria: null, clasificacionesSalud: null };

      page().agregarPromoAlCarrito(promo);

      expect(presenter.agregarAlCarrito).not.toHaveBeenCalled();
    });

    it('dado con alumno, deberia armar un producto combo y agregarlo', () => {
      presenter.alumno.set({ id: 'a1' });
      const promo = { id: 'promo-1', nombre: 'Combo', precio: 1000, imagen: '', descripcion: '', categoria: null, clasificacionesSalud: null };

      page().agregarPromoAlCarrito(promo);

      expect(presenter.agregarAlCarrito).toHaveBeenCalled();
      const [prodArg] = presenter.agregarAlCarrito.calls.mostRecent().args;
      expect((prodArg as { esCombo: boolean }).esCombo).toBeTrue();
    });
  });

  describe('abrirModalFavorito / cerrarModalFavorito', () => {
    it('dado sin alumno, no deberia abrir el modal', () => {
      presenter.alumno.set(null);
      presenter.itemsCarrito.set([{ producto: { id: 'x' }, cantidad: 1 }]);

      page().abrirModalFavorito();

      const cmp = component as unknown as { mostrarModalFavorito: boolean };
      expect(cmp.mostrarModalFavorito).toBeFalse();
    });

    it('dado carrito vacio, no deberia abrir el modal', () => {
      presenter.alumno.set({ id: 'a1' });
      presenter.itemsCarrito.set([]);

      page().abrirModalFavorito();

      const cmp = component as unknown as { mostrarModalFavorito: boolean };
      expect(cmp.mostrarModalFavorito).toBeFalse();
    });

    it('dado alumno + items, deberia abrir el modal y mapear los items', () => {
      presenter.alumno.set({ id: 'a1' });
      presenter.itemsCarrito.set([
        { producto: { id: 'p1', nombre: 'Alfajor', precio: 500 }, cantidad: 2 },
      ]);

      page().abrirModalFavorito();

      const cmp = component as unknown as { mostrarModalFavorito: boolean; favoritoModalItems: unknown[] };
      expect(cmp.mostrarModalFavorito).toBeTrue();
      expect(cmp.favoritoModalItems.length).toBe(1);
    });

    it('dado el modal abierto, cuando cierro, deberia limpiar todo', () => {
      presenter.alumno.set({ id: 'a1' });
      presenter.itemsCarrito.set([{ producto: { id: 'p1', nombre: 'X', precio: 100 }, cantidad: 1 }]);
      page().abrirModalFavorito();

      page().cerrarModalFavorito();

      const cmp = component as unknown as { mostrarModalFavorito: boolean; favoritoModalItems: unknown[] };
      expect(cmp.mostrarModalFavorito).toBeFalse();
      expect(cmp.favoritoModalItems.length).toBe(0);
    });
  });

  describe('isAtStart / isAtEnd', () => {
    it('dado index 0, isAtStart deberia devolver true', () => {
      expect(page().isAtStart()).toBeTrue();
    });

    it('dado 1 promocion, isAtEnd deberia ser true', () => {
      presenter.promociones.set([
        { id: 'p1', name: 'X', productIds: [], discountPercentage: 0 },
      ]);
      presenter.productos.set([]);

      expect(page().isAtEnd()).toBeTrue();
    });
  });

  describe('esPromocion', () => {
    it('dado un producto null/undefined, deberia devolver false', () => {
      expect(page().esPromocion(null)).toBeFalse();
      expect(page().esPromocion(undefined)).toBeFalse();
    });

    it('dado un producto con nombre que empieza con "promo", deberia ser promocion', () => {
      expect(page().esPromocion({ nombre: 'Promo del dia', categoria: null })).toBeTrue();
    });

    it('dado un producto con nombre que empieza con "combo", deberia ser promocion', () => {
      expect(page().esPromocion({ nombre: 'Combo especial', categoria: null })).toBeTrue();
    });

    it('dado un producto con "duo pack" en el nombre, deberia ser promocion', () => {
      expect(page().esPromocion({ nombre: 'X duo pack', categoria: null })).toBeTrue();
    });

    it('dado una categoria con "combo" o "promo" en descripcion, deberia ser promocion', () => {
      expect(page().esPromocion({ nombre: 'Otro', categoria: { descripcion: 'Combos varios', id: 'c' } })).toBeTrue();
      expect(page().esPromocion({ nombre: 'Otro', categoria: { descripcion: 'Promos', id: 'p' } })).toBeTrue();
    });

    it('dado un id de categoria con "promo" o "combo", deberia ser promocion', () => {
      expect(page().esPromocion({ nombre: 'X', categoria: { id: 'promo-x', descripcion: 'Y' } })).toBeTrue();
      expect(page().esPromocion({ nombre: 'X', categoria: { id: 'combo-x', descripcion: 'Y' } })).toBeTrue();
    });

    it('dado un producto normal, no deberia ser promocion', () => {
      expect(page().esPromocion({ nombre: 'Alfajor', categoria: { id: 'snacks', descripcion: 'Snacks' } })).toBeFalse();
    });

    it('dado producto sin nombre ni categoria (falsy), no deberia romper y deberia devolver false', () => {
      expect(page().esPromocion({})).toBeFalse();
    });
  });

  describe('promocionesDestacadas / promocionesDestacadasFiltradas', () => {
    beforeEach(() => {
      presenter.promociones.set([
        {
          id: 'promo-1',
          name: 'Combo Rendidor',
          productIds: ['p1', 'p2', 'nunca-existe'],
          discountPercentage: 15,
        },
      ]);
      presenter.productos.set([
        {
          id: 'p1',
          nombre: 'Alfajor',
          precio: 500,
          imagen: 'alfa.jpg',
          clasificacionesSalud: [{ id: 'sin-tacc', descripcion: 'Sin TACC' }],
          categoria: { id: 'snacks', descripcion: 'Snacks' },
        },
        {
          id: 'p2',
          nombre: 'Jugo',
          precio: 300,
          imagen: '',
          clasificacionesSalud: [],
          categoria: { id: 'bebidas', descripcion: 'Bebidas' },
          bloqueado: true,
          motivoBloqueo: 'Contiene: Gluten (TACC)',
        },
      ]);
    });

    it('dado promocion con products, promocionesDestacadas deberia calcular precio con descuento y bloqueada por tutor', () => {
      const promos = page().promocionesDestacadas() as { precio: number; descuento: string; imagen: string; bloqueada: boolean; motivoBloqueo: string }[];

      expect(promos.length).toBe(1);
      // 800 * (1 - 0.15) = 680
      expect(promos[0].precio).toBe(680);
      expect(promos[0].descuento).toBe('-15%');
      expect(promos[0].imagen).toBe('alfa.jpg');
      expect(promos[0].bloqueada).toBeTrue();
      expect(promos[0].motivoBloqueo).toContain('Gluten');
    });

    it('dado vista alumno, las promos bloqueadas por el tutor deberian ocultarse', () => {
      (servicioUsuario.esVistaAlumno as unknown as { set(v: boolean): void }).set(true);

      expect(page().promocionesDestacadasFiltradas()).toEqual([]);
    });

    it('dado un texto en busqueda que no matchea, promocionesDestacadasFiltradas deberia filtrarlas', () => {
      presenter.filtros.set({ busqueda: 'xxxx', categoriaId: 'todas', precioMin: null, precioMax: null });

      expect(page().promocionesDestacadasFiltradas()).toEqual([]);
    });

    it('dado precioMin > precio de la promo, deberia filtrarla', () => {
      presenter.filtros.set({ busqueda: '', categoriaId: 'todas', precioMin: 10000, precioMax: null });

      expect(page().promocionesDestacadasFiltradas()).toEqual([]);
    });

    it('dado precioMax menor al precio, deberia filtrarla', () => {
      presenter.filtros.set({ busqueda: '', categoriaId: 'todas', precioMin: null, precioMax: 100 });

      expect(page().promocionesDestacadasFiltradas()).toEqual([]);
    });

    it('dado categoriaId distinta, deberia filtrarla', () => {
      presenter.filtros.set({ busqueda: '', categoriaId: 'bebidas', precioMin: null, precioMax: null });

      expect(page().promocionesDestacadasFiltradas()).toEqual([]);
    });

    it('dado promocion sin discount y sin productos con imagen, deberia usar la imagen default y descuento vacio', () => {
      presenter.promociones.set([
        { id: 'promo-2', name: 'Vacia', productIds: [], discountPercentage: 0 },
      ]);

      const [promo] = page().promocionesDestacadas() as { imagen: string; descuento: string; precio: number }[];

      expect(promo.imagen).toContain('unsplash.com/photo-1606755962773');
      expect(promo.descuento).toBe('');
      expect(promo.precio).toBe(0);
    });
  });

  describe('productosSueltos', () => {
    it('dado productosFiltrados con promos y sueltos, productosSueltos deberia excluir las promos', () => {
      presenter.productosFiltrados.set([
        { id: '1', nombre: 'Alfajor', categoria: { id: 's', descripcion: 'Snacks' } },
        { id: '2', nombre: 'Combo x', categoria: { id: 'c', descripcion: 'Combos' } },
      ]);

      const sueltos = page().productosSueltos() as { nombre: string }[];

      expect(sueltos.map((p) => p.nombre)).toEqual(['Alfajor']);
    });
  });

  describe('puedeComprarPromo', () => {
    it('dado sin alumno cargado, puedeComprarPromo deberia ser false', () => {
      presenter.alumno.set(null);

      expect(page().puedeComprarPromo({ id: 'promo-1', precio: 500 })).toBeFalse();
    });
  });

  describe('promoComoProducto', () => {
    it('dado una promo con categoria y clasificaciones, deberia mapearla a Producto', () => {
      const producto = page().promoComoProducto({
        id: 'promo-x',
        nombre: 'Combo XYZ',
        descripcion: 'A + B',
        precio: 700,
        categoria: { id: 'c', descripcion: 'Combos' },
        clasificacionesSalud: [],
        imagen: 'x.png',
      }) as { id: string; esCombo?: boolean; estadoStock: string };

      expect(producto.id).toBe('promo-x');
      expect(producto.esCombo).toBeTrue();
      expect(producto.estadoStock).toBe('DISPONIBLE');
    });

    it('dado una promo sin categoria/clasificaciones/imagen, deberia usar los fallbacks', () => {
      const producto = page().promoComoProducto({
        id: 'promo-y',
        nombre: 'Y',
        precio: 100,
      }) as { descripcion: string; categoria: { id: string }; clasificacionesSalud: unknown[]; imagen: string };

      expect(producto.descripcion).toBe('');
      expect(producto.categoria.id).toBe('comidas');
      expect(producto.clasificacionesSalud).toEqual([]);
      expect(producto.imagen).toBe('');
    });
  });

  describe('agregarPromoAlCarrito', () => {
    it('dado sin alumno, no deberia agregar nada', () => {
      presenter.alumno.set(null);

      page().agregarPromoAlCarrito({ id: 'promo-1', precio: 100 });

      expect(presenter.agregarAlCarrito).not.toHaveBeenCalled();
    });

    it('dado con alumno y carrito vacio, deberia agregar y abrir el panel lateral si estaba cerrado', () => {
      presenter.alumno.set({ id: 'a1' });
      presenter.itemsCarrito.set([]);
      const p = component as unknown as { panelLateralCerrado: { set(v: boolean): void; (): boolean } };
      p.panelLateralCerrado.set(true);

      page().agregarPromoAlCarrito({ id: 'promo-1', nombre: 'Combo', precio: 500 });

      expect(presenter.agregarAlCarrito).toHaveBeenCalled();
      expect(p.panelLateralCerrado()).toBeFalse();
    });
  });

  describe('onAgregarAlCarrito', () => {
    it('dado carrito vacio y cantidad > 0 con panel cerrado, deberia abrirlo', () => {
      presenter.itemsCarrito.set([]);
      const p = component as unknown as { panelLateralCerrado: { set(v: boolean): void; (): boolean } };
      p.panelLateralCerrado.set(true);

      page().onAgregarAlCarrito({ id: 'prod-1', nombre: 'X' }, 2);

      expect(presenter.setCantidadProducto).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'prod-1' }), 2);
      expect(p.panelLateralCerrado()).toBeFalse();
    });

    it('dado carrito no vacio, no deberia tocar el panel', () => {
      presenter.itemsCarrito.set([{ producto: { id: 'x' }, cantidad: 1 }]);
      const p = component as unknown as { panelLateralCerrado: { set(v: boolean): void; (): boolean } };
      p.panelLateralCerrado.set(true);

      page().onAgregarAlCarrito({ id: 'prod-1' }, 1);

      expect(p.panelLateralCerrado()).toBeTrue();
    });
  });

  describe('getMensajeRestriccionPromo', () => {
    it('dado un motivo mapeado, deberia devolverlo formateado', () => {
      expect(page().getMensajeRestriccionPromo({ motivoBloqueo: 'Contiene: Gluten (TACC)' }))
        .toBe('No apto: Contiene TACC');
    });

    it('dado un motivo desconocido, deberia dejarlo tal cual como fallback', () => {
      expect(page().getMensajeRestriccionPromo({ motivoBloqueo: 'Contiene: Colorantes' }))
        .toBe('No apto: Colorantes');
    });

    it('dado sin motivo, deberia devolver "No apto"', () => {
      expect(page().getMensajeRestriccionPromo({})).toBe('No apto');
    });
  });

  describe('carousel de promociones', () => {
    it('dado sin promosContainer, getMaxSlideIndex indirectamente via scrollCarousel no deberia romper', () => {
      presenter.promociones.set([
        { id: 'p1', name: 'X', productIds: [], discountPercentage: 0 },
        { id: 'p2', name: 'Y', productIds: [], discountPercentage: 0 },
      ]);

      expect(() => (component as unknown as { scrollCarousel(d: number): void }).scrollCarousel(1)).not.toThrow();
    });

    it('dado onCarouselScroll con un container sin cards, deberia setear index basado en scroll', () => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'scrollLeft', { value: 728 }); // 2 * (340 + 24) = 728
      const event = { target: container } as unknown as Event;

      (component as unknown as { onCarouselScroll(e: Event): void }).onCarouselScroll(event);

      const p = component as unknown as { activeSlideIndex(): number };
      expect(p.activeSlideIndex()).toBe(2);
    });
  });

  describe('todosLosColegios', () => {
    it('dado el service devuelve colegios, todosLosColegios deberia exponerlos', () => {
      servicioColegios.getColegios.and.returnValue([{ id: 'c1', nombre: 'Colegio X' }]);

      const colegios = component.todosLosColegios();

      expect(colegios.map((c) => c.id)).toEqual(['c1']);
    });
  });

  describe('promocionesDestacadas — fallbacks', () => {
    it('dado promocion sin productIds y sin discountPercentage, deberia usar arrays vacios y precio 0', () => {
      presenter.promociones.set([
        { id: 'promo-vacia', name: 'Vacia' },
      ]);
      presenter.productos.set([]);

      const promos = page().promocionesDestacadas() as { precio: number; itemsList: string[] }[];

      expect(promos.length).toBe(1);
      expect(promos[0].precio).toBe(0);
      expect(promos[0].itemsList).toEqual([]);
    });

    it('dado un producto sin clasificacionesSalud y sin precio, deberia usar defaults', () => {
      presenter.promociones.set([
        { id: 'p1', name: 'X', productIds: ['p1'], discountPercentage: 0 },
      ]);
      presenter.productos.set([{ id: 'p1', nombre: 'X' }]);

      const promos = page().promocionesDestacadas() as { precio: number; clasificacionesSalud: unknown[] }[];

      expect(promos[0].precio).toBe(0);
      expect(promos[0].clasificacionesSalud).toEqual([]);
    });
  });

  describe('onPrecioMinCambia con valor vacio', () => {
    it('dado input vacio en Max, deberia enviar null al presenter', () => {
      whenInput('onPrecioMaxCambia', '');

      expect(presenter.setPrecioMax).toHaveBeenCalledWith(null);
    });
  });

  function givenRol(rol: RolUsuario | null): void {
    servicioPerfil.rol.and.returnValue(rol);
  }

  function whenMontoLaPagina(): void {
    fixture.detectChanges();
    tick();
  }

  function whenInput(metodo: keyof PageProtegida, valor: string): void {
    const evento = { target: { value: valor } } as unknown as Event;
    (page()[metodo] as (e: Event) => void)(evento);
  }

  function page(): PageProtegida {
    return component as unknown as PageProtegida;
  }
});

function crearPresenterMock(): PresenterMockShape {
  return {
    init: jasmine.createSpy('init'),
    buscar: jasmine.createSpy('buscar'),
    seleccionarCategoria: jasmine.createSpy('seleccionarCategoria'),
    seleccionarClasificacion: jasmine.createSpy('seleccionarClasificacion'),
    toggleSoloFavoritos: jasmine.createSpy('toggleSoloFavoritos'),
    setPrecioMin: jasmine.createSpy('setPrecioMin'),
    setPrecioMax: jasmine.createSpy('setPrecioMax'),
    cambiarAlumno: jasmine.createSpy('cambiarAlumno'),
    setFecha: jasmine.createSpy('setFecha'),
    setRecreo: jasmine.createSpy('setRecreo'),
    agregarAlCarrito: jasmine.createSpy('agregarAlCarrito'),
    setCantidadProducto: jasmine.createSpy('setCantidadProducto'),
    fechaSeleccionada: signal<string | null>('2024-05-10'),
    fechaMinima: signal('2024-05-01'),
    saldo: signal(1500),
    franjas: signal<FranjaTest[]>([
      FranjaMother.crear({ descripcion: 'Primer Recreo', horaInicio: '10:00', horaFin: '10:15' }),
      FranjaMother.crear({ id: 'f2', descripcion: 'Segundo Recreo', horaInicio: '12:00', horaFin: '12:15' }),
      FranjaMother.crear({ id: 'f3', descripcion: 'Mediodia', horaInicio: '13:00', horaFin: '14:00' }),
      FranjaMother.crear({ id: 'f4', descripcion: 'Salida', horaInicio: '16:00', horaFin: '16:30' }),
    ]),
    promociones: signal<unknown[]>([]),
    productos: signal<unknown[]>([]),
    productosFiltrados: signal<unknown[]>([]),
    filtros: signal({ busqueda: '', categoriaId: 'todas', precioMin: null, precioMax: null }),
    itemsCarrito: signal<unknown[]>([]),
    alumno: signal<unknown>({ id: 'a1', nombre: 'Juan', saldo: 1500 }),
    presupuestoDisponible: signal<unknown>(null),
    restriccionesHorariasInformativas: signal<unknown[]>([]),
    restriccionesNutricionales: signal<unknown[]>([]),
  };
}
