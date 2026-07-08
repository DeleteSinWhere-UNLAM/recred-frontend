import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DirectivoDashboardComponent } from './directivo-dashboard.component';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

describe('DirectivoDashboardComponent', () => {
  let component: DirectivoDashboardComponent;
  let fixture: ComponentFixture<DirectivoDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectivoDashboardComponent],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DirectivoDashboardComponent);
    component = fixture.componentInstance;
  });

  it('dado el componente, cuando se monta, deberia crearse', () => {
    whenMonto();
    expect(component).toBeTruthy();
  });

  it('debería renderizar mensaje de carga cuando loading es true', () => {
    component.loading = true;
    fixture.detectChanges();
    const loadingEl = fixture.debugElement.query(By.css('.pv__notice[role="status"]'));
    expect(loadingEl).toBeTruthy();
  });

  it('debería renderizar error cuando hay un mensaje de error', () => {
    component.error = 'Error fatal';
    fixture.detectChanges();
    const errorEl = fixture.debugElement.query(By.css('.pv__notice--error'));
    expect(errorEl.nativeElement.textContent).toContain('Error fatal');
  });

  it('debería renderizar el colegio y buffets', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      licencia: {
        estado: 'ACTIVA',
        fechaVencimiento: '2026-08-05T22:48:39',
        monto: 20,
        moneda: 'USD',
      },
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
    
    const h1 = fixture.debugElement.query(By.css('#pv-title')).nativeElement;
    expect(h1.textContent).toContain('Colegio Test');
    
    const card = fixture.debugElement.query(By.css('.pv__operation-card'));
    expect(card).toBeTruthy();
    expect(card.nativeElement.textContent).toContain('Kiosco 1');
  });

  it('dado licencia activa, deberia mostrar monto y vigencia', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      licencia: {
        estado: 'ACTIVA',
        fechaVencimiento: '2026-08-05T22:48:39',
        monto: 20,
        moneda: 'USD',
      },
      buffets: [],
    };
    fixture.detectChanges();

    const licencia = fixture.debugElement.query(By.css('.pv__license-card')).nativeElement as HTMLElement;
    expect(licencia.textContent).toContain('Licencia colegio');
    expect(licencia.textContent).toContain('USD 20 / mes');
    expect(licencia.textContent).toContain('05/08/2026');
  });

  it('dado click en pagar licencia, deberia emitir el evento', () => {
    component.data = {
      id: '1',
      nombre: 'Colegio Test',
      cue: '112233',
      buffets: [],
    };
    const spy = spyOn(component.pagarLicencia, 'emit');
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('.pv__license-button')).nativeElement as HTMLButtonElement;
    boton.click();

    expect(spy).toHaveBeenCalled();
  });

  it('dado error de panel, deberia permitir iniciar pago de licencia', () => {
    component.error = 'Licencia vencida';
    const spy = spyOn(component.pagarLicencia, 'emit');
    fixture.detectChanges();

    const boton = fixture.debugElement.query(By.css('.pv__license-button')).nativeElement as HTMLButtonElement;
    expect(boton.textContent).toContain('Pagar licencia');
    boton.click();

    expect(spy).toHaveBeenCalled();
  });

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
