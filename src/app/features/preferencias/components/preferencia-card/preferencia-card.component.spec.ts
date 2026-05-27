import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreferenciaCardComponent } from './preferencia-card.component';

describe('PreferenciaCardComponent', () => {
  let component: PreferenciaCardComponent;
  let fixture: ComponentFixture<PreferenciaCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreferenciaCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferenciaCardComponent);
    component = fixture.componentInstance;

    component.preferencia = {
      producto: 'Agua',
      score: 95,
      disponible: true,
    };

    fixture.detectChanges();
  });

  it('debería crearse el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar el nombre del producto', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.producto')?.textContent)
      .toContain('Agua');
  });

  it('debería mostrar la probabilidad correctamente', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.score')?.textContent)
      .toContain('95');
  });

  it('debería mostrar el estado Disponible correctamente', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    const estado = compiled.querySelector('.estado');

    expect(estado).not.toBeNull();
    expect(estado?.textContent?.trim()).toBe('Disponible');
  });

  it('debería mostrar No disponible cuando la preferencia es falsa', () => {
  component.preferencia = {
    producto: 'Jugo',
    score: 40,
    disponible: false,
  };

  fixture.detectChanges();

  const compiled = fixture.nativeElement as HTMLElement;

  const estado = compiled.querySelector('.estado');

  expect(estado?.textContent?.trim()).toBe('No disponible');
  expect(estado?.classList).toContain('no-disponible');
});
});