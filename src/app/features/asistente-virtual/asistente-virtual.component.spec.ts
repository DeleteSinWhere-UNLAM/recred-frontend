import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciaCapacidad } from './models/capacidad-asistente.model';
import { MensajeAsistente } from './models/mensaje-asistente.model';
import { AsistenteFabComponent } from './components/asistente-fab/asistente-fab.component';
import { AsistentePanelComponent } from './components/asistente-panel/asistente-panel.component';
import { AsistenteVirtualComponent } from './asistente-virtual.component';
import { AsistenteVirtualPresenter } from './presenter/asistente-virtual.presenter';

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

describe('AsistenteVirtualComponent', () => {
  let fixture: ComponentFixture<AsistenteVirtualComponent>;
  let component: AsistenteVirtualComponent;
  let presenter: jasmine.SpyObj<AsistenteVirtualPresenter>;

  beforeEach(async () => {
    presenter = crearPresenterSpy();

    await TestBed.configureTestingModule({
      imports: [AsistenteVirtualComponent],
    })
      .overrideComponent(AsistenteVirtualComponent, {
        remove: { imports: [AsistenteFabComponent, AsistentePanelComponent] },
        add: {
          imports: [AsistenteFabStub, AsistentePanelStub],
          providers: [{ provide: AsistenteVirtualPresenter, useValue: presenter }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AsistenteVirtualComponent);
    component = fixture.componentInstance;
  });

  it('dado que se monta el componente, deberia crearse correctamente', () => {
    whenMonto();

    expect(component).toBeTruthy();
  });

  it('dado el presenter cerrado, cuando monto el componente, deberia renderizar el FAB sin el panel', () => {
    whenMonto();

    thenElFabEstaEnElDom();
    thenElPanelNoEstaEnElDom();
  });

  it('dado el presenter abierto, cuando monto el componente, deberia renderizar el panel', () => {
    givenElPresenterAbierto();

    whenMonto();

    thenElPanelEstaEnElDom();
  });

  it('dado el FAB renderizado, cuando emite togglePanel, deberia invocar toggle del presenter', () => {
    whenMonto();

    whenElFabEmiteToggle();

    expect(presenter.toggle).toHaveBeenCalled();
  });

  function givenElPresenterAbierto(): void {
    (presenter.abierto as unknown as ReturnType<typeof signal<boolean>>).set(true);
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function whenElFabEmiteToggle(): void {
    const fab = fixture.debugElement.children[0].componentInstance as AsistenteFabStub;
    fab.togglePanel.emit();
  }

  function thenElFabEstaEnElDom(): void {
    const fab = (fixture.nativeElement as HTMLElement).querySelector('app-asistente-fab');
    expect(fab).toBeTruthy();
  }

  function thenElPanelEstaEnElDom(): void {
    const panel = (fixture.nativeElement as HTMLElement).querySelector('app-asistente-panel');
    expect(panel).toBeTruthy();
  }

  function thenElPanelNoEstaEnElDom(): void {
    const panel = (fixture.nativeElement as HTMLElement).querySelector('app-asistente-panel');
    expect(panel).toBeNull();
  }
});

function crearPresenterSpy(): jasmine.SpyObj<AsistenteVirtualPresenter> {
  const spy = jasmine.createSpyObj<AsistenteVirtualPresenter>('AsistenteVirtualPresenter', [
    'abrir',
    'cerrar',
    'toggle',
    'enviar',
    'enviarSugerencia',
    'enviarFechaRetiro',
    'nuevaConversacion',
    'verMensajesAnteriores',
  ]);
  Object.assign(spy, {
    abierto: signal(false),
    mensajes: signal<readonly MensajeAsistente[]>([]),
    sugerencias: signal<readonly SugerenciaCapacidad[]>([]),
    opcionesDisponibles: signal<readonly SugerenciaCapacidad[]>([]),
    enviando: signal(false),
    procesando: signal(false),
    puedeVerHistorial: signal(false),
    requiereFechaRetiro: signal(false),
    fechaRetiroMinima: signal('2026-07-01'),
    asistenteBloqueado: signal(false),
  });
  return spy;
}
