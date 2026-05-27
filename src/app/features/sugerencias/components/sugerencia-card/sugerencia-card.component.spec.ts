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
      productoOriginal: 'Gaseosa',
      productoSugerido: 'Jugo',
      motivo: 'Producto bloqueado por adulto',
      bloqueado: true,
      disponible: true,
    };

    fixture.detectChanges();

  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar el producto original', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Gaseosa');

  });

  it('debería renderizar la sugerencia IA', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Jugo');

  });

  it('debería mostrar el motivo de la sugerencia', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Producto bloqueado por adulto');

  });

  it('debería mostrar el estado bloqueado', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Producto bloqueado');

  });

  it('debería mostrar el estado permitido cuando no está bloqueado', () => {

    component.sugerencia = {
      productoOriginal: 'Chocolate',
      productoSugerido: 'Barra de cereal',
      motivo: 'Sugerencia saludable',
      bloqueado: false,
      disponible: true,
    };

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Producto permitido');

  });

});