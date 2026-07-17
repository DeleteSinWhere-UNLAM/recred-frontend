import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilService } from '../../data-access/services/perfil.service';
import { HomeAlumnoService } from '../home-alumno/services/home-alumno.service';
import { AsistenteFabComponent } from './components/asistente-fab/asistente-fab.component';
import { AsistentePanelComponent } from './components/asistente-panel/asistente-panel.component';
import { AsistenteVirtualComponent } from './asistente-virtual.component';
import { AsistenteVirtualService } from './services/asistente-virtual.service';
import { SugerenciaCapacidad } from './models/capacidad-asistente.model';
import { MensajeAsistente } from './models/mensaje-asistente.model';
import { PerfilMother } from '../../data-access/services/alumno.mother';
import { RespuestaAsistenteMother } from './asistente-virtual.mother';
import { ToastService } from '../../shared/services/toast.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';

@Component({
  selector: 'app-asistente-fab',
  template: '',
  standalone: true,
})
class AsistenteFabStub {
  @Input() oculto = false;
  @Input() mostrarBadge = true;
  @Input() bloqueado = false;
  @Output() togglePanel = new EventEmitter<void>();
}

@Component({
  selector: 'app-asistente-panel',
  template: '',
  standalone: true,
})
class AsistentePanelStub {
  @Input() mensajes: readonly MensajeAsistente[] = [];
  @Input() sugerencias: readonly SugerenciaCapacidad[] = [];
  @Input() opciones: readonly SugerenciaCapacidad[] = [];
  @Input() enviando = false;
  @Input() deshabilitado = false;
  @Input() mostrarHistorial = false;
  @Input() mostrarSelectorFechaRetiro = false;
  @Input() fechaRetiroMinima = '';
  @Output() cerrar = new EventEmitter<void>();
  @Output() enviar = new EventEmitter<string>();
  @Output() sugerencia = new EventEmitter<string>();
  @Output() fechaRetiro = new EventEmitter<string>();
  @Output() nuevaConversacion = new EventEmitter<void>();
  @Output() verHistorial = new EventEmitter<void>();
}

describe('AsistenteVirtual Integration', () => {
  let fixture: ComponentFixture<AsistenteVirtualComponent>;
  let servicioAsistente: jasmine.SpyObj<AsistenteVirtualService>;
  let servicioPerfil: jasmine.SpyObj<PerfilService>;
  let servicioHomeAlumno: jasmine.SpyObj<HomeAlumnoService>;
  let servicioToast: jasmine.SpyObj<ToastService>;
  let servicioAlumnos: jasmine.SpyObj<AlumnosService>;

  beforeEach(async () => {
    servicioAsistente = jasmine.createSpyObj('AsistenteVirtualService', [
      'enviarMensaje',
      'listarSesiones',
      'obtenerMensajes',
      'cerrarSesion',
      'eliminarSesion',
    ]);
    servicioAsistente.listarSesiones.and.resolveTo([]);
    servicioAsistente.obtenerMensajes.and.resolveTo([]);
    servicioAsistente.cerrarSesion.and.resolveTo();

    servicioPerfil = jasmine.createSpyObj('PerfilService', ['rol', 'getPerfil', 'obtenerAlumnoId']);
    servicioPerfil.rol.and.returnValue('ALUMNO');
    servicioPerfil.getPerfil.and.returnValue(PerfilMother.crear({ rol: 'ALUMNO', plan: 'INTERMEDIO' }));
    servicioPerfil.obtenerAlumnoId.and.returnValue(null);

    servicioHomeAlumno = jasmine.createSpyObj('HomeAlumnoService', ['cargarPedidoEnCurso']);
    servicioHomeAlumno.cargarPedidoEnCurso.and.resolveTo();
    servicioToast = jasmine.createSpyObj('ToastService', ['mostrar']);
    servicioAlumnos = jasmine.createSpyObj('AlumnosService', ['asegurarCargados']);
    servicioAlumnos.asegurarCargados.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [AsistenteVirtualComponent],
      providers: [
        { provide: AsistenteVirtualService, useValue: servicioAsistente },
        { provide: PerfilService, useValue: servicioPerfil },
        { provide: HomeAlumnoService, useValue: servicioHomeAlumno },
        { provide: ToastService, useValue: servicioToast },
        { provide: AlumnosService, useValue: servicioAlumnos },
      ],
    })
      .overrideComponent(AsistenteVirtualComponent, {
        remove: { imports: [AsistenteFabComponent, AsistentePanelComponent] },
        add: { imports: [AsistenteFabStub, AsistentePanelStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AsistenteVirtualComponent);
  });

  it('dado que se monta el componente, deberia renderizar el FAB cerrado y sin panel', () => {
    whenMonto();

    thenElFabEstaEnElDom();
    thenElPanelNoEstaEnElDom();
  });

  it('dado un rol ALUMNO, cuando el FAB emite toggle, deberia abrir el panel con la bienvenida del rol a traves del presenter real', async () => {
    whenMonto();

    await whenElFabHaceToggle();

    const panel = obtenerPanel();
    expect(panel).toBeTruthy();
    expect(panel.mensajes.length).toBe(1);
    expect(panel.mensajes[0].texto).toContain('saldo, compras, menu y pedidos');
  });

  it('dado el panel abierto, cuando emite enviar con un texto, deberia mandarlo al service y propagar el mensaje y la respuesta al panel', async () => {
    givenRespuestaDelBack('Tu saldo es de $ 1500');
    whenMonto();
    await whenElFabHaceToggle();

    await whenElPanelEnvia('saldo');

    expect(servicioAsistente.enviarMensaje).toHaveBeenCalledWith({ rol: 'ALUMNO' }, 'saldo', null);
    const panelActualizado = obtenerPanel();
    expect(panelActualizado.mensajes.length).toBe(3);
    expect(panelActualizado.mensajes[1].texto).toBe('saldo');
    expect(panelActualizado.mensajes[2].texto).toBe('Tu saldo es de $ 1500');
  });

  function givenRespuestaDelBack(texto: string): void {
    servicioAsistente.enviarMensaje.and.resolveTo(RespuestaAsistenteMother.crear({ respuesta: texto }));
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  async function whenElFabHaceToggle(): Promise<void> {
    const fab = fixture.debugElement.query((d) => d.componentInstance instanceof AsistenteFabStub)
      ?.componentInstance as AsistenteFabStub;
    fab.togglePanel.emit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function whenElPanelEnvia(texto: string): Promise<void> {
    const panel = obtenerPanel();
    panel.enviar.emit(texto);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function obtenerPanel(): AsistentePanelStub {
    return fixture.debugElement.query((d) => d.componentInstance instanceof AsistentePanelStub)
      ?.componentInstance as AsistentePanelStub;
  }

  function thenElFabEstaEnElDom(): void {
    expect((fixture.nativeElement as HTMLElement).querySelector('app-asistente-fab')).toBeTruthy();
  }

  function thenElPanelNoEstaEnElDom(): void {
    expect((fixture.nativeElement as HTMLElement).querySelector('app-asistente-panel')).toBeNull();
  }
});
