import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SugerenciasPage } from './sugerencias.page';

describe('SugerenciasPage', () => {
  let component: SugerenciasPage;
  let fixture: ComponentFixture<SugerenciasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciasPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
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

    expect(compiled.textContent).toContain('Sugerencias IA');
  });

  it('debería renderizar productos sugeridos', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Gaseosa');

    expect(compiled.textContent).toContain('Chocolate');
  });
});
