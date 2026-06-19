import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BuffetPage } from './buffet.page';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { BuffetPresenter } from './presenter/buffet.presenter';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('BuffetPage', () => {
  let component: BuffetPage;
  let fixture: ComponentFixture<BuffetPage>;

  let activatedRouteMock: any;
  let usuarioServiceSpy: jasmine.SpyObj<UsuarioService>;
  let perfilServiceSpy: jasmine.SpyObj<PerfilService>;
  let alumnosServiceSpy: jasmine.SpyObj<AlumnosService>;
  let colegiosServiceSpy: jasmine.SpyObj<ColegiosService>;
  
  // Mock Presenter using signals for testing
  let presenterMock: any;

  beforeEach(async () => {
    activatedRouteMock = {
      snapshot: { paramMap: { get: (key: string) => 'a1' } }
    };
    usuarioServiceSpy = jasmine.createSpyObj('UsuarioService', ['setHomeUrl'], {
      nombreNavbar: 'Juan',
      esVistaAlumno: signal(false)
    });
    perfilServiceSpy = jasmine.createSpyObj('PerfilService', ['rol']);
    alumnosServiceSpy = jasmine.createSpyObj('AlumnosService', ['asegurarCargados'], {
      alumnos: signal([{ id: 'a1', nombre: 'Juan' }])
    });
    colegiosServiceSpy = jasmine.createSpyObj('ColegiosService', ['getColegios']);

    presenterMock = {
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
      fechaSeleccionada: signal('2024-05-10'),
      fechaMinima: signal('2024-05-01'),
      saldo: signal(1500),
      franjas: signal([
        { descripcion: 'Primer Recreo', horaInicio: '10:00', horaFin: '10:15' },
        { descripcion: 'Segundo Recreo', horaInicio: '12:00', horaFin: '12:15' },
        { descripcion: 'Mediodia', horaInicio: '13:00', horaFin: '14:00' },
        { descripcion: 'Salida', horaInicio: '16:00', horaFin: '16:30' }
      ])
    };

    perfilServiceSpy.rol.and.returnValue('PADRE');
    alumnosServiceSpy.asegurarCargados.and.returnValue(Promise.resolve([]));
    colegiosServiceSpy.getColegios.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [BuffetPage],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: UsuarioService, useValue: usuarioServiceSpy },
        { provide: PerfilService, useValue: perfilServiceSpy },
        { provide: AlumnosService, useValue: alumnosServiceSpy },
        { provide: ColegiosService, useValue: colegiosServiceSpy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .overrideComponent(BuffetPage, {
      set: { providers: [{ provide: BuffetPresenter, useValue: presenterMock }] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuffetPage);
    component = fixture.componentInstance;
  });

  it('debería crearse y llamar init en ngOnInit', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // wait for asegurarCargados
    expect(component).toBeTruthy();
    expect(usuarioServiceSpy.setHomeUrl).toHaveBeenCalledWith('/tutor');
    expect(alumnosServiceSpy.asegurarCargados).toHaveBeenCalledWith(true);
    expect(presenterMock.init).toHaveBeenCalledWith('a1');
  }));

  it('debería setear homeUrl correcto según el rol', () => {
    perfilServiceSpy.rol.and.returnValue('ALUMNO');
    expect(component['homeUrlPorRol']()).toBe('/alumno');
    perfilServiceSpy.rol.and.returnValue('VENDEDOR');
    expect(component['homeUrlPorRol']()).toBe('/kiosquero');
    perfilServiceSpy.rol.and.returnValue(null);
    expect(component['homeUrlPorRol']()).toBe('/tutor');
  });

  it('debería manejar error en asegurarCargados', fakeAsync(() => {
    spyOn(console, 'error');
    alumnosServiceSpy.asegurarCargados.and.returnValue(Promise.reject('Error de red'));
    fixture.detectChanges();
    tick();
    expect(console.error).toHaveBeenCalledWith('Error al cargar alumnos para el buffet:', 'Error de red');
    expect(presenterMock.init).toHaveBeenCalledWith('a1');
  }));

  describe('Interacciones en el DOM', () => {
    it('onBusqueda', () => {
      component['onBusqueda']({ target: { value: 'texto' } } as any);
      expect(presenterMock.buscar).toHaveBeenCalledWith('texto');
    });

    it('onCategoria', () => {
      component['onCategoria']({ target: { value: 'cat1' } } as any);
      expect(presenterMock.seleccionarCategoria).toHaveBeenCalledWith('cat1');
    });

    it('onClasificacion', () => {
      component['onClasificacion']({ target: { value: 'clas1' } } as any);
      expect(presenterMock.seleccionarClasificacion).toHaveBeenCalledWith('clas1');
    });

    it('onToggleSoloFavoritos', () => {
      component['onToggleSoloFavoritos']();
      expect(presenterMock.toggleSoloFavoritos).toHaveBeenCalled();
    });

    it('onPrecioMinCambia y onPrecioMaxCambia', () => {
      component['onPrecioMinCambia']({ target: { value: '10' } } as any);
      expect(presenterMock.setPrecioMin).toHaveBeenCalledWith(10);
      
      component['onPrecioMaxCambia']({ target: { value: '20' } } as any);
      expect(presenterMock.setPrecioMax).toHaveBeenCalledWith(20);

      component['onPrecioMinCambia']({ target: { value: '' } } as any);
      expect(presenterMock.setPrecioMin).toHaveBeenCalledWith(null);
    });

    it('abrirSelector y cerrarSelector', () => {
      component['abrirSelector']();
      expect(component['mostrarSelector']()).toBeTrue();
      component['cerrarSelector']();
      expect(component['mostrarSelector']()).toBeFalse();
    });

    it('onAlumnoSeleccionado', () => {
      component['onAlumnoSeleccionado']('a2');
      expect(component['mostrarSelector']()).toBeFalse();
      expect(presenterMock.cambiarAlumno).toHaveBeenCalledWith('a2');
    });

    it('onFechaCambia', () => {
      component['onFechaCambia']({ target: { value: '2024-06-01' } } as any);
      expect(presenterMock.setFecha).toHaveBeenCalledWith('2024-06-01');
    });

    it('onRecreoCambia', () => {
      component['onRecreoCambia']({ target: { value: 'MEDIODIA' } } as any);
      expect(presenterMock.setRecreo).toHaveBeenCalledWith('MEDIODIA');
    });
  });

  describe('Formateadores y UI getters', () => {
    it('saldoFormateado', () => {
      // 1500 -> "$ 1.500" o similar dependiendo del locale
      expect(component['saldoFormateado']).toContain('1'); // Has numbers
      expect(component['saldoFormateado']).toContain('500'); 
    });

    it('formatARS', () => {
      expect(component['formatARS'](2000)).toContain('2');
    });

    it('formatFecha', () => {
      expect(component['formatFecha']('2024-05-10')).toBe('10/05/2024');
      expect(component['formatFecha']('')).toBe('');
    });

    it('nombreMesCalendario', () => {
      presenterMock.fechaSeleccionada.set('2024-05-10');
      const mes = component['nombreMesCalendario']();
      expect(mes.toLowerCase()).toContain('mayo');
      
      presenterMock.fechaSeleccionada.set(null);
      expect(component['nombreMesCalendario']()).toBe('');
    });
  });

  describe('Lógica del Calendario', () => {
    it('generateCalendar', () => {
      component['generateCalendar']('2024-05-10');
      const dias = component['diasCalendario']();
      expect(dias.length).toBe(42); // 6 semanas * 7 días
      
      const primero = dias.find(d => d.fechaStr === '2024-05-01');
      expect(primero).toBeTruthy();
      
      const bloqueadoAnterior = dias.find(d => d.fechaStr === '2024-04-30'); // fecha mínima es 2024-05-01
      if(bloqueadoAnterior) expect(bloqueadoAnterior.bloqueado).toBeTrue();

      const finDeSemana = dias.find(d => d.fechaStr === '2024-05-04'); // Sábado
      if(finDeSemana) {
        expect(finDeSemana.esFinDeSemana).toBeTrue();
        expect(finDeSemana.bloqueado).toBeTrue();
      }
    });

    it('generateCalendar vacio', () => {
      component['generateCalendar']('');
      expect(component['diasCalendario']().length).toBe(0);
    });

    it('seleccionarDiaCalendario', () => {
      const cellActiva = { bloqueado: false, fechaStr: '2024-05-10' } as any;
      component['seleccionarDiaCalendario'](cellActiva);
      expect(presenterMock.setFecha).toHaveBeenCalledWith('2024-05-10');

      presenterMock.setFecha.calls.reset();
      const cellBloqueada = { bloqueado: true, fechaStr: '2024-05-04' } as any;
      component['seleccionarDiaCalendario'](cellBloqueada);
      expect(presenterMock.setFecha).not.toHaveBeenCalled();
    });
  });

  describe('obtenerRangoHorario', () => {
    it('debería emparejar con PRIMER_RECREO', () => {
      expect(component['obtenerRangoHorario']('PRIMER_RECREO')).toBe('10:00 - 10:15');
    });

    it('debería emparejar con SEGUNDO_RECREO', () => {
      expect(component['obtenerRangoHorario']('SEGUNDO_RECREO')).toBe('12:00 - 12:15');
    });

    it('debería emparejar con MEDIODIA', () => {
      expect(component['obtenerRangoHorario']('MEDIODIA')).toBe('13:00 - 14:00');
    });

    it('debería emparejar con FUERA_HORA', () => {
      expect(component['obtenerRangoHorario']('FUERA_HORA')).toBe('16:00 - 16:30');
    });

    it('debería retornar string vacío si no hace match o no hay franjas', () => {
      presenterMock.franjas.set([]);
      expect(component['obtenerRangoHorario']('PRIMER_RECREO')).toBe('');
    });

    it('debería manejar franjas con formato HH:MM:SS recortando los segundos', () => {
      presenterMock.franjas.set([
        { descripcion: 'Primer Recreo', horaInicio: '10:00:00', horaFin: '10:15:00' }
      ]);
      expect(component['obtenerRangoHorario']('PRIMER_RECREO')).toBe('10:00 - 10:15');
    });
  });
});
