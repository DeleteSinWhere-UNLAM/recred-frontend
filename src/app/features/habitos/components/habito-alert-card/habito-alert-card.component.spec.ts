import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitoAlertCardComponent } from './habito-alert-card.component';

describe('HabitoAlertCardComponent', () => {

  let component: HabitoAlertCardComponent;
  let fixture: ComponentFixture<HabitoAlertCardComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [HabitoAlertCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitoAlertCardComponent);

    component = fixture.componentInstance;

    component.alerta = {
      alumno: 'Julián García',
      categoria: 'Golosinas',
      porcentajeGasto: 40,
      mensaje: 'Tu hijo gasta 40% en golosinas',
      sugerencia: '¿Deseas limitar este tipo de productos?',
    };

    fixture.detectChanges();

  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar el nombre del alumno', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Julián García');

  });

  it('debería mostrar la categoría de consumo', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Golosinas');

  });

  it('debería mostrar el porcentaje de gasto', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('40%');

  });

  it('debería mostrar el mensaje de alerta', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Tu hijo gasta 40% en golosinas');

  });

  it('debería mostrar la sugerencia al tutor', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('¿Deseas limitar este tipo de productos?');

  });

});