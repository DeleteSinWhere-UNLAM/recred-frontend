import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SugerenciaCardComponent } from './sugerencia-card.component';

describe('SugerenciaCardComponent', () => {
  let component: SugerenciaCardComponent;

  let fixture: ComponentFixture<SugerenciaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciaCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciaCardComponent);

    component = fixture.componentInstance;

    component.sugerencia = {
      productoOriginal: 'Paso de los Toros Pomelo 500ml',

      resumen: 'Te sugiero una alternativa popular de gaseosa.',

      alertas: ['Precio extremadamente bajo.'],

      productosSugeridos: ['Sprite Lima Limón 500ml', 'Schweppes Pomelo 500ml'],

      motivoIA: 'Bajo consumo detectado.',

      modeloIA: 'gemini-2.5-flash',
    };

    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar el producto original', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Paso de los Toros Pomelo 500ml');
  });

  it('debería mostrar el resumen IA', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(
      'Te sugiero una alternativa popular',
    );
  });

  it('debería mostrar las alertas', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('1 alertas');
  });

  it('debería renderizar productos sugeridos', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('2 sugerencias');
  });

  it('debería mostrar el resumen IA', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(
      'Te sugiero una alternativa popular',
    );
  });
});
