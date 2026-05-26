import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciasPage } from './preferencias.page';

describe('PreferenciasPage', () => {
  let component: PreferenciasPage;
  let fixture: ComponentFixture<PreferenciasPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciasPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciasPage);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('debería crear la página', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar productos en pantalla', () => {
  const compiled = fixture.nativeElement as HTMLElement;

  expect(compiled.textContent).toContain('Agua');
  expect(compiled.textContent).toContain('Tostado');
  expect(compiled.textContent).toContain('Jugo');
});


it('debería cargar preferencias correctamente desde el componente', () => {
  expect(component.preferencias.length).toBeGreaterThan(0);
});

it('debería tener preferencias válidas con producto y score', () => {
  const todasValidas = component.preferencias.every(p =>
    p.producto &&
    typeof p.score === 'number' &&
    typeof p.disponible === 'boolean'
  );

  expect(todasValidas).toBeTrue();
});

it('debería mostrar "No disponible" cuando la preferencia no está disponible', () => {
  const compiled = fixture.nativeElement as HTMLElement;

  const noDisponibles = compiled.textContent;

  expect(noDisponibles).toContain('No disponible');
});

it('debería identificar correctamente una preferencia no disponible', () => {
  const noDisponibles = component.preferencias.filter(p => !p.disponible);

  expect(noDisponibles.length).toBe(1);
  expect(noDisponibles[0].producto).toBe('Jugo');
});
});