import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsistentePanelComponent } from './asistente-panel.component';

describe('AsistentePanelComponent', () => {
  let component: AsistentePanelComponent;
  let fixture: ComponentFixture<AsistentePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistentePanelComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AsistentePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que se invoca onCerrar, deberia emitir el evento', () => {
    spyOn(component.cerrar, 'emit');
    component['onCerrar']();
    expect(component.cerrar.emit).toHaveBeenCalled();
  });

  it('dado que se invoca onEscape, deberia emitir el evento de cerrar', () => {
    spyOn(component.cerrar, 'emit');
    component['onEscape']();
    expect(component.cerrar.emit).toHaveBeenCalled();
  });

  it('dado que se invoca onNuevaConversacion, deberia emitir', () => {
    spyOn(component.nuevaConversacion, 'emit');
    component['onNuevaConversacion']();
    expect(component.nuevaConversacion.emit).toHaveBeenCalled();
  });

  it('dado que se invoca onVerHistorial, deberia emitir', () => {
    spyOn(component.verHistorial, 'emit');
    component['onVerHistorial']();
    expect(component.verHistorial.emit).toHaveBeenCalled();
  });

  it('dado que se invoca onEnviar, deberia emitir con el texto', () => {
    spyOn(component.enviar, 'emit');
    component['onEnviar']('Test');
    expect(component.enviar.emit).toHaveBeenCalledWith('Test');
  });

  it('dado que se invoca onSugerencia, deberia emitir', () => {
    spyOn(component.sugerencia, 'emit');
    component['onSugerencia']('prompt test');
    expect(component.sugerencia.emit).toHaveBeenCalledWith('prompt test');
  });

  it('dado que no hay opciones y se hace toggleAcciones, no deberia cambiar estado', () => {
    component.opciones = [];
    component['accionesAbiertasState'].set(true);
    component['onToggleAcciones']();
    expect(component['accionesAbiertasState']()).toBeTrue();
  });

  it('dado que hay opciones y se hace toggleAcciones, deberia invertir estado', () => {
    component.opciones = [{ id: '1', label: '', prompt: '', emoji: '', tipo: 'consulta' }];
    component['accionesAbiertasState'].set(true);
    component['onToggleAcciones']();
    expect(component['accionesAbiertasState']()).toBeFalse();
  });

  it('dado que se hace click en opcion y esta deshabilitado, no deberia emitir', () => {
    component.deshabilitado = true;
    spyOn(component.sugerencia, 'emit');
    component['onOpcion']({ id: '1', label: '', prompt: 'x', emoji: '', tipo: 'consulta' });
    expect(component.sugerencia.emit).not.toHaveBeenCalled();
  });

  it('dado que se hace click en opcion, deberia cerrar acciones y emitir', () => {
    component.deshabilitado = false;
    component['accionesAbiertasState'].set(true);
    spyOn(component.sugerencia, 'emit');
    component['onOpcion']({ id: '1', label: '', prompt: 'test', emoji: '', tipo: 'consulta' });
    expect(component.sugerencia.emit).toHaveBeenCalledWith('test');
    expect(component['accionesAbiertasState']()).toBeFalse();
  });

  it('dado que se crean grupos de opciones, deberia categorizarlas correctamente', () => {
    const opciones = [
      { id: '1', label: '1', prompt: '', emoji: '', tipo: 'consulta' as const, capacidad: 'SALDO' as const },
      { id: '2', label: '2', prompt: '', emoji: '', tipo: 'consulta' as const, capacidad: 'VENTAS' as const },
      { id: '3', label: '3', prompt: '', emoji: '', tipo: 'consulta' as const } // sin capacidad
    ];
    const grupos = component['crearGruposOpciones'](opciones);
    
    expect(grupos.length).toBe(3);
    const ids = grupos.map(g => g.id);
    expect(ids).toContain('cuenta');
    expect(ids).toContain('buffet');
    expect(ids).toContain('general');
  });

  it('dado que se proveen inputs setters, deberian actualizar el estado', () => {
    component.mensajes = [{ id: 'm', rol: 'usuario', texto: '', fechaHora: new Date() }];
    expect(component['mensajesState']().length).toBe(1);

    component.sugerencias = [{ id: 's', label: '', prompt: '', emoji: '', tipo: 'consulta' }];
    expect(component['sugerenciasState']().length).toBe(1);

    component.enviando = true;
    expect(component['enviandoState']()).toBeTrue();

    component.deshabilitado = true;
    expect(component['deshabilitadoState']()).toBeTrue();

    component.mostrarHistorial = true;
    expect(component['mostrarHistorialState']()).toBeTrue();
  });

  it('dado que trackBy, deberian retornar ids correspondientes', () => {
    expect(component['trackById'](0, { id: 'id1', rol: 'usuario', texto: '', fechaHora: new Date() })).toBe('id1');
    expect(component['trackByGrupo'](0, { id: 'general', label: '', opciones: [] })).toBe('general');
    expect(component['trackByOpcion'](0, { id: 'o1', label: '', prompt: '', emoji: '', tipo: 'consulta' })).toBe('o1');
  });
});
