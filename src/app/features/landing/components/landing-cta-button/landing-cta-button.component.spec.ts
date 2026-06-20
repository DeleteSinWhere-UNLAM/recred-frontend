import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LandingCtaButtonComponent } from './landing-cta-button.component';
import { CtaLanding } from '../../models/cta-landing.model';

describe('LandingCtaButtonComponent', () => {
  let componente: LandingCtaButtonComponent;
  let fixture: ComponentFixture<LandingCtaButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingCtaButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LandingCtaButtonComponent);
    componente = fixture.componentInstance;
  });

  it('dado que se inicializa, debe crearse correctamente', () => {
    // Seteamos el @Input requerido antes del primer detectChanges
    componente.cta = { texto: 'Inicio', variante: 'primario' } as CtaLanding;
    fixture.detectChanges();
    expect(componente).toBeTruthy();
  });

  describe('comportamiento del @Input cta', () => {
    it('dado que recibe un texto, debe renderizarlo en el botón', () => {
      componente.cta = { texto: 'Registrarse', variante: 'primario' } as CtaLanding;
      fixture.detectChanges();

      const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
      expect(boton.textContent?.trim()).toBe('Registrarse');
    });

    it('dado que la variante es primario, debe aplicar la clase cta--primario', () => {
      componente.cta = { texto: 'Comprar', variante: 'primario' } as CtaLanding;
      fixture.detectChanges();

      const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
      expect(boton.classList.contains('cta--primario')).toBeTrue();
      expect(boton.classList.contains('cta--secundario')).toBeFalse();
    });

    it('dado que la variante es secundario, debe aplicar la clase cta--secundario', () => {
      componente.cta = { texto: 'Ver más', variante: 'secundario' } as CtaLanding;
      fixture.detectChanges();

      const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
      expect(boton.classList.contains('cta--secundario')).toBeTrue();
      expect(boton.classList.contains('cta--primario')).toBeFalse();
    });
  });

  describe('comportamiento de eventos (@Output)', () => {
    it('dado que se hace clic en el botón, debe emitir el evento clicked', () => {
      componente.cta = { texto: 'Acción', variante: 'primario' } as CtaLanding;
      fixture.detectChanges();

      spyOn(componente.clicked, 'emit');

      const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
      boton.click();

      expect(componente.clicked.emit).toHaveBeenCalled();
    });
  });
});
