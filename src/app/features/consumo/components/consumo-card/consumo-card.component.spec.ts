import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsumoCardComponent } from './consumo-card.component';

describe('ConsumoCardComponent', () => {

  let component: ConsumoCardComponent;
  let fixture: ComponentFixture<ConsumoCardComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [ConsumoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsumoCardComponent);

    component = fixture.componentInstance;

    component.consumo = {
      alumno: 'Julián García',
      productoFrecuente: 'Jugo',
      frecuencia: '4 veces por semana',
      recomendacion: 'Ofrecer jugos sin azúcar',
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

  it('debería mostrar el producto frecuente', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Jugo');

  });

  it('debería mostrar la frecuencia de compra', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('4 veces por semana');

  });

  it('debería mostrar la recomendación IA', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Ofrecer jugos sin azúcar');

  });

});