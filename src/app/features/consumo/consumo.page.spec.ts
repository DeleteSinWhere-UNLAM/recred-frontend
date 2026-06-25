import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { ConsumoPage } from './consumo.page';

describe('ConsumoPage', () => {

  let component: ConsumoPage;
  let fixture: ComponentFixture<ConsumoPage>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [ConsumoPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsumoPage);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });

  it('debería crear la página', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el título de aprendizaje de consumo', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Aprendizaje de consumo');

  });

  it('debería renderizar alumnos correctamente', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Julián García');

    expect(compiled.textContent)
      .toContain('Sofía García');

  });

  it('debería mostrar productos frecuentes', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Jugo');

    expect(compiled.textContent)
      .toContain('Tostado');

  });

  it('debería mostrar recomendaciones IA', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Ofrecer jugos sin azúcar');

    expect(compiled.textContent)
      .toContain('Agregar combos saludables');

  });

});