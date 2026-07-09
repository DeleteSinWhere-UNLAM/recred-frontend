import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Perfil } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { SubscriptionPaymentService } from '../../../data-access/services/suscripciones/subscription-payment.service';
import { ToastService } from '../../services/toast.service';
import { PricingPlansComponent } from './pricing-plans.component';

describe('PricingPlansComponent', () => {
  let component: PricingPlansComponent;
  let fixture: ComponentFixture<PricingPlansComponent>;
  let perfilSignal: ReturnType<typeof signal<Perfil | null>>;
  let asegurarPerfilSpy: jasmine.Spy;
  let cargarPerfilSpy: jasmine.Spy;
  let servicioSuscripcion: jasmine.SpyObj<SubscriptionPaymentService>;
  let servicioToast: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    perfilSignal = signal<Perfil | null>(perfilVendedor());
    asegurarPerfilSpy = jasmine.createSpy('asegurarPerfil').and.resolveTo(perfilVendedor());
    cargarPerfilSpy = jasmine.createSpy('cargarPerfil').and.resolveTo();
    servicioSuscripcion = jasmine.createSpyObj<SubscriptionPaymentService>('SubscriptionPaymentService', [
      'crearSuscripcionUsuario',
      'activarPruebaUsuario',
    ]);
    servicioToast = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);
    givenCrearSuscripcionResuelve();
    servicioSuscripcion.activarPruebaUsuario.and.resolveTo({});

    await TestBed.configureTestingModule({
      imports: [PricingPlansComponent],
      providers: [
        {
          provide: PerfilService,
          useValue: {
            perfil: perfilSignal.asReadonly(),
            asegurarPerfil: asegurarPerfilSpy,
            cargarPerfil: cargarPerfilSpy,
          },
        },
        { provide: SubscriptionPaymentService, useValue: servicioSuscripcion },
        { provide: ToastService, useValue: servicioToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('plans segun userType', () => {
    it('dado userType padre (default), cuando pido los planes, deberia armar los 3 con features de padre', () => {
      const planes = component.plans();

      expect(planes.length).toBe(3);
      expect(planes.map((p) => p.id)).toEqual(['basico', 'intermedio', 'avanzado']);
      const avanzado = planes[2];
      expect(avanzado.features.map((f) => f.name)).toContain('Inteligencia artificial');
      expect(avanzado.features.map((f) => f.name)).toContain('Promociones exclusivas');
      expect(avanzado.features.map((f) => f.name)).not.toContain('Carga de stock masiva');
    });

    it('dado userType kiosquero, cuando pido los planes, deberia armarlos con features de kiosquero', () => {
      givenUserType('kiosquero');

      const planes = component.plans();

      const avanzado = planes[2];
      expect(avanzado.features.map((f) => f.name)).toContain('Carga de stock masiva');
      expect(avanzado.features.map((f) => f.name)).toContain('Promociones');
      expect(avanzado.features.map((f) => f.name)).not.toContain('Transferencia entre hijos');
    });

    it('dado el plan basico, cuando lo miro, deberia tener solo las 3 features basicas incluidas', () => {
      const basico = component.plans()[0];

      const incluidas = basico.features.filter((f) => f.included).map((f) => f.name);
      expect(incluidas).toEqual(['Funciones esenciales', 'Soporte general', 'Notificaciones']);
    });

    it('dado el plan intermedio de padre, cuando lo miro, deberia estar destacado y tener las features intermedias incluidas', () => {
      const intermedio = component.plans()[1];

      expect(intermedio.isHighlighted).toBeTrue();
      expect(intermedio.features.filter((f) => f.included).length).toBe(5);
      expect(intermedio.features.find((f) => f.name === 'Promociones exclusivas')?.included).toBeFalse();
    });

    it('dado el plan avanzado, cuando lo miro, deberia tener todas las features incluidas', () => {
      const avanzado = component.plans()[2];

      expect(avanzado.features.every((f) => f.included)).toBeTrue();
    });

    it('dado los precios, cuando comparo mensual y anual, el anual deberia ser mensual * 12 * 0.8 (20% descuento)', () => {
      const intermedio = component.plans()[1];

      expect(intermedio.priceMonthly).toBe(5500);
      expect(intermedio.priceAnnual).toBe(5500 * 12 * 0.8);
    });

    it('dado el plan basico, cuando pido los precios, priceMonthly y priceAnnual deberian ser 0', () => {
      const basico = component.plans()[0];

      expect(basico.priceMonthly).toBe(0);
      expect(basico.priceAnnual).toBe(0);
    });
  });

  describe('plan actual', () => {
    it('dado perfil gratuito, deberia mostrar Gratuito como plan actual', () => {
      givenPerfilPlan('GRATUITO');

      expect(component.planActualLabel()).toBe('Gratuito');
      expect(component.esPlanActual('basico')).toBeTrue();
    });

    it('dado perfil intermedio, deberia marcar intermedio como plan actual', () => {
      givenPerfilPlan('INTERMEDIO');

      expect(component.planActualLabel()).toBe('Intermedio');
      expect(component.esPlanActual('intermedio')).toBeTrue();
      expect(component.planNoComprable('intermedio')).toBeTrue();
      expect(component.planNoComprable('avanzado')).toBeFalse();
    });

    it('dado perfil avanzado, deberia impedir comprar planes iguales o menores', () => {
      givenPerfilPlan('AVANZADO');

      expect(component.planActualLabel()).toBe('Avanzado');
      expect(component.esPlanActual('avanzado')).toBeTrue();
      expect(component.planNoComprable('intermedio')).toBeTrue();
      expect(component.planNoComprable('avanzado')).toBeTrue();
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
    it('dado plan basico, cuando lo selecciono, no deberia llamar al backend', async () => {
      givenUserType('kiosquero');

      await component.selectPlan('basico');

      expect(servicioSuscripcion.crearSuscripcionUsuario).not.toHaveBeenCalled();
    });

    it('dado userType padre, cuando selecciona un plan pago, deberia crear la suscripcion y redirigir', async () => {
      const redireccion = givenRedireccionAPagoInterceptada();

      await component.selectPlan('intermedio');

      expect(servicioSuscripcion.crearSuscripcionUsuario).toHaveBeenCalledWith({
        usuarioId: 'usuario-1',
        plan: 'INTERMEDIO',
        periodo: 'MENSUAL',
      });
      expect(redireccion).toHaveBeenCalledWith('https://www.mercadopago.com/checkout');
    });

    it('dado vendedor y plan intermedio mensual, cuando selecciona el plan, deberia crear la suscripcion y redirigir', async () => {
      givenUserType('kiosquero');
      const redireccion = givenRedireccionAPagoInterceptada();

      await component.selectPlan('intermedio');

      expect(servicioSuscripcion.crearSuscripcionUsuario).toHaveBeenCalledWith({
        usuarioId: 'usuario-1',
        plan: 'INTERMEDIO',
        periodo: 'MENSUAL',
      });
      expect(redireccion).toHaveBeenCalledWith('https://www.mercadopago.com/checkout');
    });

    it('dado vendedor con plan intermedio, cuando selecciona intermedio, no deberia llamar al backend', async () => {
      givenUserType('kiosquero');
      givenPerfilPlan('INTERMEDIO');

      await component.selectPlan('intermedio');

      expect(servicioSuscripcion.crearSuscripcionUsuario).not.toHaveBeenCalled();
    });

    it('dado vendedor con plan avanzado, cuando selecciona intermedio, no deberia llamar al backend', async () => {
      givenUserType('kiosquero');
      givenPerfilPlan('AVANZADO');

      await component.selectPlan('intermedio');

      expect(servicioSuscripcion.crearSuscripcionUsuario).not.toHaveBeenCalled();
    });

    it('dado vendedor y periodo anual, cuando selecciona avanzado, deberia enviar periodo ANUAL', async () => {
      givenUserType('kiosquero');
      component.isAnnualGlobal.set(true);
      givenRedireccionAPagoInterceptada();

      await component.selectPlan('avanzado');

      expect(servicioSuscripcion.crearSuscripcionUsuario).toHaveBeenCalledWith({
        usuarioId: 'usuario-1',
        plan: 'AVANZADO',
        periodo: 'ANUAL',
      });
    });
  });

  describe('render', () => {
    it('dado el componente, cuando se monta, deberia renderizar 3 pricing-card', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');

      expect(cards.length).toBe(3);
    });

    it('dado perfil intermedio, deberia mostrar Plan actual en la card intermedia', () => {
      givenPerfilPlan('INTERMEDIO');
      fixture.detectChanges();

      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');
      const intermedio = cards[1];

      expect(intermedio.classList.contains('current')).toBeTrue();
      expect(intermedio.querySelector('.current-plan-badge')?.textContent).toContain('Plan actual');
      expect((intermedio.querySelector('.btn-select') as HTMLButtonElement).disabled).toBeTrue();
      expect(intermedio.querySelector('.btn-select')?.textContent).toContain('Plan actual');
    });

    it('dado perfil intermedio, la card avanzada deberia quedar habilitada como mejora', () => {
      givenPerfilPlan('INTERMEDIO');
      fixture.detectChanges();

      const avanzado = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card')[2];

      expect((avanzado.querySelector('.btn-select') as HTMLButtonElement).disabled).toBeFalse();
      expect(avanzado.querySelector('.btn-select')?.textContent).toContain('Mejorar plan');
    });

    it('dado el plan intermedio destacado, cuando se renderiza, deberia agregar la clase highlighted a su card', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');

      expect(cards[0].classList.contains('highlighted')).toBeFalse();
      expect(cards[1].classList.contains('highlighted')).toBeTrue();
      expect(cards[2].classList.contains('highlighted')).toBeFalse();
    });

    it('dado isAnnualGlobal false, cuando se renderiza, deberia mostrar el precio mensual con "/ mes"', () => {
      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');
      const period = cards[1].querySelector('.period');

      expect(period?.textContent?.trim()).toBe('/ mes');
    });

    it('dado isAnnualGlobal true, cuando se renderiza, deberia mostrar el precio anual con "/ año" y el banner de ahorro', () => {
      component.isAnnualGlobal.set(true);
      fixture.detectChanges();

      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');
      const intermedio = cards[1];
      expect(intermedio.querySelector('.period')?.textContent?.trim()).toBe('/ año');

      const banner = intermedio.querySelector('.saving-banner');
      expect(banner?.classList.contains('invisible')).toBeFalse();
      expect(banner?.textContent).toContain('Ahorrás');
    });

    it('dado isAnnualGlobal true pero plan basico con precio 0, cuando se renderiza, deberia mostrar "/ mes" y el banner invisible', () => {
      component.isAnnualGlobal.set(true);
      fixture.detectChanges();

      const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-card');
      const basico = cards[0];
      expect(basico.querySelector('.period')?.textContent?.trim()).toBe('/ mes');
      expect(basico.querySelector('.saving-banner')?.classList.contains('invisible')).toBeTrue();
    });

    it('dado el boton Seleccionar Plan, cuando hago click, deberia llamar selectPlan con el id de la card', () => {
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

  describe('diasRestantes', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-07-09T00:00:00Z'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('deberia calcular 0 si no hay fecha de vencimiento', () => {
      perfilSignal.set(perfilVendedor({ fechaVencimientoPlan: null }));
      expect(component.diasRestantes()).toBe(0);
    });

    it('deberia calcular los dias restantes correctamente si la fecha es futura', () => {
      perfilSignal.set(perfilVendedor({ fechaVencimientoPlan: '2026-07-19T00:00:00Z' }));
      expect(component.diasRestantes()).toBe(10);
    });

    it('deberia retornar 0 si la fecha ya paso', () => {
      perfilSignal.set(perfilVendedor({ fechaVencimientoPlan: '2026-07-01T00:00:00Z' }));
      expect(component.diasRestantes()).toBe(0);
    });
  });

  describe('esElegibleParaTrial', () => {
    it('deberia retornar false si el plan no es avanzado', () => {
      expect(component.esElegibleParaTrial('basico')).toBeFalse();
      expect(component.esElegibleParaTrial('intermedio')).toBeFalse();
    });

    it('deberia retornar false si ya tiene el plan avanzado', () => {
      givenPerfilPlan('AVANZADO');
      expect(component.esElegibleParaTrial('avanzado')).toBeFalse();
    });

    it('deberia retornar false si el plan actual es intermedio aunque sea avanzado el parametro', () => {
      givenPerfilPlan('INTERMEDIO');
      expect(component.esElegibleParaTrial('avanzado')).toBeFalse();
    });

    it('deberia retornar true si el plan es GRATUITO y no ha usado el trial', () => {
      perfilSignal.set(perfilVendedor({ plan: 'GRATUITO', hasUsedTrial: false }));
      expect(component.esElegibleParaTrial('avanzado')).toBeTrue();
    });

    it('deberia retornar false si el plan es GRATUITO pero ya uso el trial', () => {
      perfilSignal.set(perfilVendedor({ plan: 'GRATUITO', hasUsedTrial: true }));
      expect(component.esElegibleParaTrial('avanzado')).toBeFalse();
    });
  });

  describe('selectTrial', () => {
    it('cuando se activa exitosamente, debe llamar al backend, refrescar perfil y mostrar toast de exito', async () => {
      servicioSuscripcion.activarPruebaUsuario.and.resolveTo({});

      await component.selectTrial('avanzado');

      expect(servicioSuscripcion.activarPruebaUsuario).toHaveBeenCalledWith({
        usuarioId: 'usuario-1',
        plan: 'AVANZADO',
      });
      expect(cargarPerfilSpy).toHaveBeenCalled();
      expect(servicioToast.mostrar).toHaveBeenCalledWith('¡Periodo de prueba de 1 mes activado!', 'success');
    });

    it('cuando falla, debe capturar el error, setear errorCompra y mostrar toast de error', async () => {
      servicioSuscripcion.activarPruebaUsuario.and.rejectWith(new Error('Backend error'));

      await component.selectTrial('avanzado');

      expect(component.errorCompra()).toBe('No pudimos activar el periodo de prueba. Intenta de nuevo.');
      expect(servicioToast.mostrar).toHaveBeenCalledWith('No pudimos activar el periodo de prueba.', 'error');
    });
  });

  function givenUserType(userType: 'padre' | 'kiosquero'): void {
    fixture.componentRef.setInput('userType', userType);
    fixture.detectChanges();
  }

  function givenCrearSuscripcionResuelve(): void {
    servicioSuscripcion.crearSuscripcionUsuario.and.resolveTo({
      paymentUrl: 'https://www.mercadopago.com/checkout',
      plan: 'INTERMEDIO',
      periodo: 'MENSUAL',
      price: 5500,
      currency: 'ARS',
    });
  }

  function givenRedireccionAPagoInterceptada(): jasmine.Spy {
    const priv = component as unknown as { redirigirAPago(url: string): void };
    return spyOn(priv, 'redirigirAPago').and.stub();
  }

  function givenPerfilPlan(plan: string): void {
    perfilSignal.set(perfilVendedor({ plan }));
  }

  function perfilVendedor(override: Partial<Perfil> = {}): Perfil {
    return {
      id: 'usuario-1',
      email: 'vendedor@recred.com',
      nombre: 'Vendedor',
      apellido: 'Demo',
      rol: 'VENDEDOR',
      plan: 'GRATUITO',
      ...override,
    };
  }
});
