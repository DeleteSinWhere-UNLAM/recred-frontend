import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PricingPlansComponent } from '../../shared/components/pricing-plans/pricing-plans.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PremiumPlansPage } from './premium-plans.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {}

@Component({ selector: 'app-pricing-plans', template: '', standalone: true })
class PricingPlansStub {
  @Input() userType: 'padre' | 'kiosquero' = 'padre';
}

describe('PremiumPlansPage', () => {
  let component: PremiumPlansPage;
  let fixture: ComponentFixture<PremiumPlansPage>;
  let router: Router;
  let esVistaKiosqueroSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    esVistaKiosqueroSignal = signal(false);
    const servicioUsuario = {
      esVistaKiosquero: esVistaKiosqueroSignal.asReadonly(),
    };

    await TestBed.configureTestingModule({
      imports: [PremiumPlansPage],
      providers: [
        { provide: UsuarioService, useValue: servicioUsuario },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    })
      .overrideComponent(PremiumPlansPage, {
        remove: { imports: [NavbarComponent, PricingPlansComponent] },
        add: { imports: [NavbarStub, PricingPlansStub] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(PremiumPlansPage);
    component = fixture.componentInstance;
  });

  describe('userType segun vista actual', () => {
    it('dado que la vista actual es kiosquero, deberia exponer userType kiosquero', () => {
      givenVistaKiosquero();

      expect(component.userType()).toBe('kiosquero');
    });

    it('dado que la vista actual no es kiosquero, deberia exponer userType padre', () => {
      givenVistaTutor();

      expect(component.userType()).toBe('padre');
    });
  });

  describe('render del boton volver', () => {
    it('dado vista kiosquero, cuando hago click en Volver, deberia navegar a /kiosquero', () => {
      givenVistaKiosquero();

      whenMonto();
      whenHagoClickEnVolver();

      expect(router.navigateByUrl).toHaveBeenCalledWith(
        jasmine.objectContaining({ toString: jasmine.any(Function) }) as never,
        jasmine.any(Object) as never,
      );
      const url = (router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0].toString();
      expect(url).toBe('/kiosquero');
    });

    it('dado vista tutor, cuando hago click en Volver, deberia navegar a /tutor', () => {
      givenVistaTutor();

      whenMonto();
      whenHagoClickEnVolver();

      const url = (router.navigateByUrl as jasmine.Spy).calls.mostRecent().args[0].toString();
      expect(url).toBe('/tutor');
    });
  });

  describe('pricing-plans', () => {
    it('dado vista kiosquero, cuando se monta, deberia pasarle userType kiosquero al app-pricing-plans', () => {
      givenVistaKiosquero();

      whenMonto();

      const plans = (fixture.nativeElement as HTMLElement).querySelector('app-pricing-plans');
      expect(plans).not.toBeNull();
    });
  });

  function givenVistaKiosquero(): void {
    esVistaKiosqueroSignal.set(true);
  }

  function givenVistaTutor(): void {
    esVistaKiosqueroSignal.set(false);
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }

  function whenHagoClickEnVolver(): void {
    const boton = (fixture.nativeElement as HTMLElement).querySelector('.venta__volver') as HTMLButtonElement;
    boton.click();
  }
});
