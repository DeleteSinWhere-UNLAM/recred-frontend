import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { HabitosPage } from './habitos.page';

describe('HabitosPage', () => {

  let component: HabitosPage;
  let fixture: ComponentFixture<HabitosPage>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [HabitosPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HabitosPage);

    component = fixture.componentInstance;

    fixture.detectChanges();

  });

  it('debería crear la página', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el título de hábitos de consumo', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Hábitos de consumo');

  });

  it('debería renderizar alertas de alumnos', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Julián García');

  });

  it('debería mostrar mensajes de alerta', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('Tu hijo gasta 40% en golosinas');

  });

  it('debería mostrar sugerencias al tutor', () => {

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent)
      .toContain('¿Deseas limitar este tipo de productos?');

  });

});