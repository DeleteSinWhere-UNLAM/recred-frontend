import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoDashboardComponent } from './directivo-dashboard.component';
import { By } from '@angular/platform-browser';

describe('DirectivoDashboardComponent', () => {
  let component: DirectivoDashboardComponent;
  let fixture: ComponentFixture<DirectivoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectivoDashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectivoDashboardComponent);
    component = fixture.componentInstance;
  });

  it('debería renderizar mensaje de carga cuando loading es true', () => {
    component.loading = true;
    fixture.detectChanges();
    const loadingEl = fixture.debugElement.query(By.css('.loading-state'));
    expect(loadingEl).toBeTruthy();
  });

  it('debería renderizar error cuando hay un mensaje de error', () => {
    component.error = 'Error fatal';
    fixture.detectChanges();
    const errorEl = fixture.debugElement.query(By.css('.error-alert'));
    expect(errorEl.nativeElement.textContent).toContain('Error fatal');
  });

  it('debería renderizar el colegio y buffets', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      buffets: [
        {
          id: 'b1',
          nombre: 'Kiosco 1',
          activo: true,
          vendedor: { id: 'v1', nombre: 'Juan', apellido: 'Perez', email: 'j@j.com', cuit: '20' }
        }
      ]
    };
    fixture.detectChanges();
    
    const h2 = fixture.debugElement.query(By.css('h2')).nativeElement;
    expect(h2.textContent).toContain('Colegio Test');
    
    const card = fixture.debugElement.query(By.css('.buffet-card'));
    expect(card).toBeTruthy();
    expect(card.nativeElement.textContent).toContain('Kiosco 1');
  });
});
