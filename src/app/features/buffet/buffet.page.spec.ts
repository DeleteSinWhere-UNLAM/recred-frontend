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
  fechaSeleccionada: ReturnType<typeof signal<string | null>>;
  fechaMinima: ReturnType<typeof signal<string>>;
  saldo: ReturnType<typeof signal<number>>;
  franjas: ReturnType<typeof signal<FranjaTest[]>>;
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
    fechaSeleccionada: signal<string | null>('2024-05-10'),
    fechaMinima: signal('2024-05-01'),
    saldo: signal(1500),
    franjas: signal<FranjaTest[]>([
      FranjaMother.crear({ descripcion: 'Primer Recreo', horaInicio: '10:00', horaFin: '10:15' }),
      FranjaMother.crear({ id: 'f2', descripcion: 'Segundo Recreo', horaInicio: '12:00', horaFin: '12:15' }),
      FranjaMother.crear({ id: 'f3', descripcion: 'Mediodia', horaInicio: '13:00', horaFin: '14:00' }),
      FranjaMother.crear({ id: 'f4', descripcion: 'Salida', horaInicio: '16:00', horaFin: '16:30' }),
    ]),
  };
}
