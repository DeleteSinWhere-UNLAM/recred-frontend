import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputMensajeComponent } from './input-mensaje.component';

describe('InputMensajeComponent', () => {
  let component: InputMensajeComponent;
  let fixture: ComponentFixture<InputMensajeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputMensajeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(InputMensajeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que esta vacio el input, no deberia permitir enviar y submit deberia no emitir', () => {
    spyOn(component.enviar, 'emit');
    component['texto'].set('   ');
    const mockEvent = new Event('submit');
    spyOn(mockEvent, 'preventDefault');

    component['onSubmit'](mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(component['puedeEnviar']).toBeFalse();
    expect(component.enviar.emit).not.toHaveBeenCalled();
  });

  it('dado que esta deshabilitado, no deberia permitir enviar', () => {
    spyOn(component.enviar, 'emit');
    component.deshabilitado = true;
    component['texto'].set('Hola');
    const mockEvent = new Event('submit');

    component['onSubmit'](mockEvent);

    expect(component['puedeEnviar']).toBeFalse();
    expect(component.enviar.emit).not.toHaveBeenCalled();
  });

  it('dado que hay texto y no esta deshabilitado, deberia emitir y limpiar', () => {
    spyOn(component.enviar, 'emit');
    component['texto'].set(' Mensaje valido ');
    const mockEvent = new Event('submit');

    component['onSubmit'](mockEvent);

    expect(component.enviar.emit).toHaveBeenCalledWith('Mensaje valido');
    expect(component['texto']()).toBe('');
  });

  it('dado que se hace click en alternar acciones, deberia emitir', () => {
    spyOn(component.alternarAcciones, 'emit');
    component['onAlternarAcciones']();
    expect(component.alternarAcciones.emit).toHaveBeenCalled();
  });
});
