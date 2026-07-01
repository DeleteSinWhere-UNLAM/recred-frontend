import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsistentePanelComponent } from './asistente-panel.component';

describe('AsistentePanelComponent', () => {
  let fixture: ComponentFixture<AsistentePanelComponent>;
  let component: AsistentePanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsistentePanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsistentePanelComponent);
    component = fixture.componentInstance;
    component.mensajes = [];
    component.sugerencias = [];
  });

  it('emite la fecha seleccionada cuando no es anterior al minimo', () => {
    spyOn(component.fechaRetiro, 'emit');
    component.mostrarSelectorFechaRetiro = true;
    component.fechaRetiroMinima = '2026-07-03';
    fixture.detectChanges();

    const input = buscarInputFecha();
    input.value = '2026-07-03';
    input.dispatchEvent(new Event('change'));

    expect(component.fechaRetiro.emit).toHaveBeenCalledOnceWith('2026-07-03');
  });

  it('no emite fechas anteriores al minimo', () => {
    spyOn(component.fechaRetiro, 'emit');
    component.mostrarSelectorFechaRetiro = true;
    component.fechaRetiroMinima = '2026-07-03';
    fixture.detectChanges();

    const input = buscarInputFecha();
    input.value = '2026-07-02';
    input.dispatchEvent(new Event('change'));

    expect(component.fechaRetiro.emit).not.toHaveBeenCalled();
  });

  function buscarInputFecha(): HTMLInputElement {
    const input = fixture.nativeElement.querySelector(
      '#asistente-fecha-retiro',
    ) as HTMLInputElement | null;
    expect(input).withContext('deberia renderizar el selector').not.toBeNull();
    return input as HTMLInputElement;
  }
});
