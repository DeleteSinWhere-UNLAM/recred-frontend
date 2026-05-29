import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SugerenciasPage } from './sugerencias.page';

describe('SugerenciasPage', () => {
  let fixture: ComponentFixture<SugerenciasPage>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciasPage);

    fixture.detectChanges();

  });

  it('debería mostrar sugerencias IA', () => {
  const compiled = fixture.nativeElement;
  expect(compiled.textContent).toContain('Sugerencias IA');
});

it('debería mostrar resumen de IA', () => {
  const compiled = fixture.nativeElement;
  expect(compiled.textContent.length).toBeGreaterThan(100);
});

it('debería mostrar productos sugeridos', () => {
  const compiled = fixture.nativeElement;

  expect(
    compiled.textContent.includes('Sprite') ||
    compiled.textContent.includes('Schweppes') ||
    compiled.textContent.includes('Pomelo')
  ).toBeTrue();
});

it('debería mostrar modelo IA', () => {
  const compiled = fixture.nativeElement;
  expect(compiled.textContent).toContain('gemini');
});

});