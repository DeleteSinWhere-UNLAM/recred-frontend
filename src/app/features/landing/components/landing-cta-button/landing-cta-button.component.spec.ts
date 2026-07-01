import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LandingCtaButtonComponent } from './landing-cta-button.component';
import { CtaLanding } from '../../models/cta-landing.model';
import { CtaLandingMother } from '../../landing.mother';

describe('LandingCtaButtonComponent', () => {
  let component: LandingCtaButtonComponent;
  let fixture: ComponentFixture<LandingCtaButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingCtaButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingCtaButtonComponent);
    component = fixture.componentInstance;
  });

  it('dado un cta seteado, cuando renderizo el componente, deberia crearse correctamente', () => {
    givenElCta(CtaLandingMother.crearPrimario());

    whenRenderizo();

    expect(component).toBeTruthy();
  });

  describe('comportamiento del @Input cta', () => {
    it('dado un cta con texto "Registrarse", cuando renderizo, deberia mostrarlo en el botón', () => {
      givenElCta(CtaLandingMother.crear({ texto: 'Registrarse' }));

      whenRenderizo();

      thenElBotonTieneTexto('Registrarse');
    });

    it('dado un cta primario, cuando renderizo, deberia aplicar la clase cta--primario', () => {
      givenElCta(CtaLandingMother.crearPrimario({ texto: 'Comprar' }));

      whenRenderizo();

      thenElBotonTieneClase('cta--primario');
      thenElBotonNoTieneClase('cta--secundario');
    });

    it('dado un cta secundario, cuando renderizo, deberia aplicar la clase cta--secundario', () => {
      givenElCta(CtaLandingMother.crearSecundario({ texto: 'Ver más' }));

      whenRenderizo();

      thenElBotonTieneClase('cta--secundario');
      thenElBotonNoTieneClase('cta--primario');
    });
  });

  describe('comportamiento del @Output clicked', () => {
    it('dado un cta primario, cuando hago click en el botón, deberia emitir el evento clicked', () => {
      givenElCta(CtaLandingMother.crearPrimario());
      whenRenderizo();
      const emitSpy = spyOn(component.clicked, 'emit');

      whenHagoClickEnElBoton();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  function givenElCta(cta: CtaLanding): void {
    component.cta = cta;
  }

  function whenRenderizo(): void {
    fixture.detectChanges();
  }

  function whenHagoClickEnElBoton(): void {
    const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
    boton.click();
  }

  function thenElBotonTieneTexto(texto: string): void {
    const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
    expect(boton.textContent?.trim()).toBe(texto);
  }

  function thenElBotonTieneClase(clase: string): void {
    const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
    expect(boton.classList.contains(clase)).toBeTrue();
  }

  function thenElBotonNoTieneClase(clase: string): void {
    const boton = fixture.debugElement.query(By.css('.cta')).nativeElement as HTMLButtonElement;
    expect(boton.classList.contains(clase)).toBeFalse();
  }
});
