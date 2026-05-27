import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SugerenciasPage } from './sugerencias.page';

describe('SugerenciasPage', () => {

  let component: SugerenciasPage;
  let fixture: ComponentFixture<SugerenciasPage>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciasPage);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });

  it('debería crear la página', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el título de sugerencias', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Sugerencias IA');

  });

  it('debería renderizar productos sugeridos', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Gaseosa');

    expect(compiled.textContent)
      .toContain('Chocolate');

  });

  it('debería mostrar productos sugeridos por IA', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Jugo');

    expect(compiled.textContent)
      .toContain('Barra de cereal');

  });

  it('debería mostrar estados bloqueado y permitido', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Producto bloqueado');

    expect(compiled.textContent)
      .toContain('Producto permitido');

  });

});