import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SugerenciasChipsComponent } from './sugerencias-chips.component';

describe('SugerenciasChipsComponent', () => {
  let component: SugerenciasChipsComponent;
  let fixture: ComponentFixture<SugerenciasChipsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciasChipsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciasChipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('dado que hay sugerencia de confirmacion, deberia devolver hint compra pendiente', () => {
    component.sugerencias = [{ id: '1', prompt: '', label: '', emoji: '', tipo: 'confirmacion' }];
    expect(component['hint']).toBe('Compra pendiente');
    expect(component['tieneCompraPendiente']).toBeTrue();
  });

  it('dado que hay sugerencias backend pero no de confirmacion, deberia devolver hint de siguiente paso', () => {
    component.sugerencias = [{ id: '1', prompt: '', label: '', emoji: '', tipo: 'backend' }];
    expect(component['hint']).toBe('Siguiente paso');
  });

  it('dado que son sugerencias normales, deberia devolver hint de opciones rapidas', () => {
    component.sugerencias = [{ id: '1', prompt: '', label: '', emoji: '', tipo: 'consulta' }];
    expect(component['hint']).toBe('Opciones rapidas');
  });

  it('dado que se hace click y no esta deshabilitado, deberia emitir el prompt', () => {
    spyOn(component.elegir, 'emit');
    component.deshabilitado = false;
    component['onClick']({ id: '1', prompt: 'test prompt', label: '', emoji: '', tipo: 'consulta' });
    expect(component.elegir.emit).toHaveBeenCalledWith('test prompt');
  });

  it('dado que se hace click y esta deshabilitado, no deberia emitir', () => {
    spyOn(component.elegir, 'emit');
    component.deshabilitado = true;
    component['onClick']({ id: '1', prompt: 'test prompt', label: '', emoji: '', tipo: 'consulta' });
    expect(component.elegir.emit).not.toHaveBeenCalled();
  });

  it('dado que se usa trackBy, deberia retornar el id', () => {
    expect(component['trackBySugerencia'](0, { id: 'test-id', prompt: '', label: '', emoji: '', tipo: 'consulta' })).toBe('test-id');
  });
});
