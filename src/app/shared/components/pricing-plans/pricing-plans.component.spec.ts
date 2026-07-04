import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PricingPlansComponent } from './pricing-plans.component';

describe('PricingPlansComponent', () => {
  let component: PricingPlansComponent;
  let fixture: ComponentFixture<PricingPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingPlansComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('plans segun userType', () => {
    it('dado userType padre (default), deberia armar los 3 planes con features de padre', () => {
      const planes = component.plans();

      expect(planes.length).toBe(3);
      expect(planes.map((p) => p.id)).toEqual(['basico', 'intermedio', 'avanzado']);
      const avanzado = planes[2];
      expect(avanzado.features.map((f) => f.name)).toContain('Promociones exclusivas');
      expect(avanzado.features.map((f) => f.name)).not.toContain('Carga de stock masiva');
    });

    it('dado userType kiosquero, deberia armar los planes con features de kiosquero', () => {
      fixture.componentRef.setInput('userType', 'kiosquero');
      fixture.detectChanges();

      const planes = component.plans();

      const avanzado = planes[2];
      expect(avanzado.features.map((f) => f.name)).toContain('Carga de stock masiva');
      expect(avanzado.features.map((f) => f.name)).toContain('Estrategias de venta personalizables');
      expect(avanzado.features.map((f) => f.name)).not.toContain('Promociones exclusivas');
    });

    it('dado el plan basico, deberia tener solo las 3 features basicas incluidas', () => {
      const basico = component.plans()[0];

      const incluidas = basico.features.filter((f) => f.included).map((f) => f.name);
      expect(incluidas).toEqual([
        'Funciones esenciales',
        'Soporte general',
        'Notificaciones',
      ]);
    });

    it('dado el plan intermedio, deberia estar marcado como destacado y tener 5 features incluidas', () => {
      const intermedio = component.plans()[1];

      expect(intermedio.isHighlighted).toBeTrue();
      expect(intermedio.features.filter((f) => f.included).length).toBe(5);
    });

    it('dado el plan avanzado, deberia tener todas las features incluidas', () => {
      const avanzado = component.plans()[2];

      expect(avanzado.features.every((f) => f.included)).toBeTrue();
    });

    it('dado los precios, el anual deberia ser mensual * 12 * 0.8 (20% descuento)', () => {
      const intermedio = component.plans()[1];

      expect(intermedio.priceMonthly).toBe(5500);
      expect(intermedio.priceAnnual).toBe(5500 * 12 * 0.8);
    });

    it('dado el plan basico, priceMonthly y priceAnnual deberian ser 0', () => {
      const basico = component.plans()[0];

      expect(basico.priceMonthly).toBe(0);
      expect(basico.priceAnnual).toBe(0);
    });
  });

  describe('toggleGlobalPeriod', () => {
    it('dado isAnnualGlobal en false, cuando hago toggle, deberia pasar a true', () => {
      expect(component.isAnnualGlobal()).toBeFalse();

      component.toggleGlobalPeriod();

      expect(component.isAnnualGlobal()).toBeTrue();
    });

    it('dado isAnnualGlobal en true, cuando hago toggle, deberia pasar a false', () => {
      component.toggleGlobalPeriod();

      component.toggleGlobalPeriod();

      expect(component.isAnnualGlobal()).toBeFalse();
    });
  });

  describe('selectPlan', () => {
    it('dado un planId, cuando lo selecciono, deberia loguearlo con el userType actual', () => {
      const spy = spyOn(console, 'log');

      component.selectPlan('intermedio');

      expect(spy).toHaveBeenCalledWith('Plan seleccionado:', 'intermedio', '| Usuario:', 'padre');
    });

    it('dado un planId y userType kiosquero, deberia loguearlo con "kiosquero"', () => {
      fixture.componentRef.setInput('userType', 'kiosquero');
      fixture.detectChanges();
      const spy = spyOn(console, 'log');

      component.selectPlan('avanzado');

      expect(spy).toHaveBeenCalledWith('Plan seleccionado:', 'avanzado', '| Usuario:', 'kiosquero');
    });
  });

  describe('render', () => {
    it('dado el componente, cuando se monta, deberia renderizar 3 pricing-card', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');

      expect(cards.length).toBe(3);
    });

    it('dado el plan intermedio destacado, deberia agregar la clase highlighted a su card', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');

      expect(cards[0].classList.contains('highlighted')).toBeFalse();
      expect(cards[1].classList.contains('highlighted')).toBeTrue();
      expect(cards[2].classList.contains('highlighted')).toBeFalse();
    });

    it('dado isAnnualGlobal false, deberia mostrar el precio mensual con "/ mes"', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');
      const period = cards[1].querySelector('.period');

      expect(period?.textContent?.trim()).toBe('/ mes');
    });

    it('dado isAnnualGlobal true, deberia mostrar el precio anual con "/ año" y el banner de ahorro', () => {
      component.isAnnualGlobal.set(true);
      fixture.detectChanges();

      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');
      const intermedio = cards[1];
      expect(intermedio.querySelector('.period')?.textContent?.trim()).toBe('/ año');

      const banner = intermedio.querySelector('.saving-banner');
      expect(banner?.classList.contains('invisible')).toBeFalse();
      expect(banner?.textContent).toContain('Ahorrás');
    });

    it('dado isAnnualGlobal true pero plan basico con precio 0, deberia mostrar "/ mes" y el banner invisible', () => {
      component.isAnnualGlobal.set(true);
      fixture.detectChanges();

      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');
      const basico = cards[0];
      expect(basico.querySelector('.period')?.textContent?.trim()).toBe('/ mes');
      expect(basico.querySelector('.saving-banner')?.classList.contains('invisible')).toBeTrue();
    });

    it('dado un click en Seleccionar Plan, deberia llamar selectPlan con el id de la card', () => {
      const spySelect = spyOn(component, 'selectPlan');

      const boton = (fixture.nativeElement as HTMLElement).querySelectorAll('.btn-select')[1] as HTMLButtonElement;
      boton.click();

      expect(spySelect).toHaveBeenCalledWith('intermedio');
    });

    it('dado el checkbox del toggle, cuando cambia, deberia llamar toggleGlobalPeriod', () => {
      const spyToggle = spyOn(component, 'toggleGlobalPeriod');

      const checkbox = (fixture.nativeElement as HTMLElement).querySelector(
        '.switch input[type="checkbox"]',
      ) as HTMLInputElement;
      checkbox.dispatchEvent(new Event('change'));

      expect(spyToggle).toHaveBeenCalled();
    });
  });
});
