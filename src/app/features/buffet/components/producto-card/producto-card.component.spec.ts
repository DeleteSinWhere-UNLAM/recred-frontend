import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { ProductoCardComponent } from './producto-card.component';
import { CarritoService } from '../../../compra/services/carrito.service';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { ProductoMother } from '../../buffet.mother';

describe('ProductoCardComponent', () => {
  let component: ProductoCardComponent;
  let fixture: ComponentFixture<ProductoCardComponent>;
  let servicioCarrito: jasmine.SpyObj<CarritoService>;
  let perfilService: Partial<PerfilService>;

  beforeEach(async () => {
    servicioCarrito = jasmine.createSpyObj<CarritoService>('CarritoService', [
      'cantidadDe',
      'puedeAgregar',
      'validarAgregar',
    ]);
    servicioCarrito.cantidadDe.and.returnValue(0);
    servicioCarrito.puedeAgregar.and.callFake((prod) => !prod.superaPresupuesto);
    servicioCarrito.validarAgregar.and.callFake((prod) => ({
      permitido: !prod.superaPresupuesto,
      razon: prod.superaPresupuesto ? 'presupuesto' : undefined,
    }));

    perfilService = { esPlanGratuito: signal(true) };

    await TestBed.configureTestingModule({
      imports: [ProductoCardComponent],
      providers: [
        { provide: CarritoService, useValue: servicioCarrito },
        { provide: PerfilService, useValue: perfilService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoCardComponent);
    component = fixture.componentInstance;
    component.producto = ProductoMother.crear();
    component.alumnoId = 'alumno-abc';
    fixture.detectChanges();
  });

  it('dado que se monta el componente, deberia crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  describe('Bloqueo manual por el tutor (candado)', () => {
    it('dado mostrarCandado=false, cuando renderizo, no deberia mostrar el boton del candado', () => {
      givenInput('mostrarCandado', false);

      thenElSelectorNoExiste('.producto-card__lock-btn');
    });

    it('dado mostrarCandado=true, cuando renderizo, deberia mostrar el boton del candado', () => {
      givenInput('mostrarCandado', true);

      thenElSelectorExiste('.producto-card__lock-btn');
    });

    it('dado un producto no bloqueado por el tutor con mostrarCandado=true, deberia mostrar el candado abierto', () => {
      givenInput('mostrarCandado', true);
      givenInput('producto', ProductoMother.crear({ bloqueado: false }));

      const lockIcon = fixture.debugElement.query(By.css('.producto-card__lock-btn i')).nativeElement as HTMLElement;
      expect(lockIcon.classList.contains('fa-lock-open')).toBeTrue();
      expect(lockIcon.classList.contains('fa-lock')).toBeFalse();
    });

    it('dado un producto bloqueado por el tutor, cuando renderizo, deberia mostrar el candado cerrado y la clase bloqueado', () => {
      givenInput('mostrarCandado', true);
      givenInput('producto', ProductoMother.crear({ bloqueado: true, estadoStock: 'SIN_STOCK' }));

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn'));
      expect((lockBtn.nativeElement as HTMLElement).classList.contains('producto-card__lock-btn--bloqueado')).toBeTrue();
      expect(
        (lockBtn.query(By.css('i')).nativeElement as HTMLElement).classList.contains('fa-lock'),
      ).toBeTrue();
    });

    it('dado un producto bloqueado por el tutor, cuando renderizo, deberia mostrar el CTA "Bloqueado por el tutor" y deshabilitado', () => {
      givenInput('producto', ProductoMother.crear({ bloqueado: true, estadoStock: 'SIN_STOCK' }));

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta')).nativeElement as HTMLButtonElement;
      expect(ctaBtn.disabled).toBeTrue();
      expect(ctaBtn.textContent).toContain('Bloqueado por el tutor');
    });

    it('dado un producto bloqueado por el tutor, cuando renderizo, deberia aplicar producto-card--bloqueado y no producto-card--restringido', () => {
      givenInput('producto', ProductoMother.crear({ bloqueado: true, estadoStock: 'SIN_STOCK' }));

      const card = fixture.debugElement.query(By.css('.producto-card')).nativeElement as HTMLElement;
      expect(card.classList.contains('producto-card--bloqueado')).toBeTrue();
      expect(card.classList.contains('producto-card--restringido')).toBeFalse();
    });

    it('dado mostrarCandado=true, cuando hago click en el candado, deberia emitir toggleLock', () => {
      givenInput('mostrarCandado', true);
      const emitSpy = spyOn(component.toggleLock, 'emit');

      whenSeClickeaSelector('.producto-card__lock-btn');

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('Bloqueo por restriccion nutricional o horaria', () => {
    it('dado restriccion de TACC, cuando renderizo, deberia mostrar el CTA "No apto: Contiene TACC"', () => {
      givenInput('producto', ProductoMother.crear({
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC)',
        estadoStock: 'SIN_STOCK',
      }));

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido'));
      expect(ctaBtn).not.toBeNull();
      expect((ctaBtn.nativeElement as HTMLButtonElement).disabled).toBeTrue();
      expect((ctaBtn.nativeElement as HTMLButtonElement).textContent).toContain('No apto: Contiene TACC');
    });

    it('dado restriccion de azucar, cuando renderizo, deberia mostrar "No apto: Contiene Azúcar"', () => {
      givenInput('producto', ProductoMother.crear({
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Azúcar',
        estadoStock: 'SIN_STOCK',
      }));

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido')).nativeElement as HTMLButtonElement;
      expect(ctaBtn.textContent).toContain('No apto: Contiene Azúcar');
    });

    it('dado restriccion de lacteos, cuando renderizo, deberia mostrar "No apto: Contiene Lácteos"', () => {
      givenInput('producto', ProductoMother.crear({
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Lácteos',
        estadoStock: 'SIN_STOCK',
      }));

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido')).nativeElement as HTMLButtonElement;
      expect(ctaBtn.textContent).toContain('No apto: Contiene Lácteos');
    });

    it('dado multiples restricciones, cuando renderizo, deberia unirlas con " · "', () => {
      givenInput('producto', ProductoMother.crear({
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC), Lácteos',
        estadoStock: 'SIN_STOCK',
      }));

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido')).nativeElement as HTMLButtonElement;
      expect(ctaBtn.textContent).toContain('No apto: Contiene TACC · Contiene Lácteos');
    });

    it('dado un producto bloqueado por restriccion, cuando renderizo, deberia aplicar producto-card--restringido y no producto-card--bloqueado', () => {
      givenInput('producto', ProductoMother.crear({
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC)',
        estadoStock: 'SIN_STOCK',
      }));

      const card = fixture.debugElement.query(By.css('.producto-card')).nativeElement as HTMLElement;
      expect(card.classList.contains('producto-card--restringido')).toBeTrue();
      expect(card.classList.contains('producto-card--bloqueado')).toBeFalse();
    });

    it('dado restriccion de ingredientes de origen animal, cuando renderizo, deberia mostrar "No Vegano"', () => {
      givenInput('producto', ProductoMother.crear({
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Ingredientes de origen animal',
        estadoStock: 'SIN_STOCK',
      }));

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido')).nativeElement as HTMLButtonElement;
      expect(ctaBtn.textContent).toContain('No Vegano');
    });

    it('dado restriccion nutricional, cuando renderizo, el candado NO deberia aparecer aunque mostrarCandado sea true', () => {
      givenInput('mostrarCandado', true);
      givenInput('producto', ProductoMother.crear({
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC)',
        estadoStock: 'SIN_STOCK',
        bloqueado: false,
      }));

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn')).nativeElement as HTMLElement;
      expect(lockBtn.classList.contains('producto-card__lock-btn--bloqueado')).toBeFalse();
    });
  });

  describe('mensajeRestriccion()', () => {
    it('dado un producto sin motivoBloqueo, cuando consulto mensajeRestriccion, deberia devolver "No apto"', () => {
      givenInput('producto', ProductoMother.crear());

      expect(component.mensajeRestriccion()).toBe('No apto');
    });

    it('dado "Contiene: Gluten (TACC)", cuando consulto mensajeRestriccion, deberia mapear a "No apto: Contiene TACC"', () => {
      givenInput('producto', ProductoMother.crear({ motivoBloqueo: 'Contiene: Gluten (TACC)' }));

      expect(component.mensajeRestriccion()).toBe('No apto: Contiene TACC');
    });

    it('dado "Contiene: Azúcar", deberia mapear a "No apto: Contiene Azúcar"', () => {
      givenInput('producto', ProductoMother.crear({ motivoBloqueo: 'Contiene: Azúcar' }));

      expect(component.mensajeRestriccion()).toBe('No apto: Contiene Azúcar');
    });

    it('dado "Contiene: Lácteos", deberia mapear a "No apto: Contiene Lácteos"', () => {
      givenInput('producto', ProductoMother.crear({ motivoBloqueo: 'Contiene: Lácteos' }));

      expect(component.mensajeRestriccion()).toBe('No apto: Contiene Lácteos');
    });

    it('dado "Contiene: Alto Sodio", deberia mapear a "No apto: Contiene Sodio"', () => {
      givenInput('producto', ProductoMother.crear({ motivoBloqueo: 'Contiene: Alto Sodio' }));

      expect(component.mensajeRestriccion()).toBe('No apto: Contiene Sodio');
    });

    it('dado "Contiene: Ingredientes de origen animal", deberia mapear a "No apto: No Vegano"', () => {
      givenInput('producto', ProductoMother.crear({ motivoBloqueo: 'Contiene: Ingredientes de origen animal' }));

      expect(component.mensajeRestriccion()).toBe('No apto: No Vegano');
    });

    it('dado multiples restricciones, deberia unirlas con " · "', () => {
      givenInput('producto', ProductoMother.crear({ motivoBloqueo: 'Contiene: Gluten (TACC), Lácteos' }));

      expect(component.mensajeRestriccion()).toBe('No apto: Contiene TACC · Contiene Lácteos');
    });
  });

  describe('disponible()', () => {
    it('dado un producto disponible sin bloqueos, cuando consulto disponible, deberia ser true', () => {
      givenInput('producto', ProductoMother.crear({ estadoStock: 'DISPONIBLE' }));

      expect(component.disponible()).toBeTrue();
    });

    it('dado un producto bloqueado por el tutor, cuando consulto disponible, deberia ser false', () => {
      givenInput('producto', ProductoMother.crear({ bloqueado: true, estadoStock: 'SIN_STOCK' }));

      expect(component.disponible()).toBeFalse();
    });

    it('dado un producto bloqueado por restriccion, cuando consulto disponible, deberia ser false', () => {
      givenInput('producto', ProductoMother.crear({ bloqueadoPorRestriccion: true, estadoStock: 'SIN_STOCK' }));

      expect(component.disponible()).toBeFalse();
    });

    it('dado un producto que supera el presupuesto, cuando consulto disponible, deberia ser false', () => {
      givenInput('producto', ProductoMother.crear({ superaPresupuesto: true, estadoStock: 'DISPONIBLE' }));

      expect(component.disponible()).toBeFalse();
    });

    it('dado un producto sin stock sin otros bloqueos, cuando consulto disponible, deberia ser false', () => {
      givenInput('producto', ProductoMother.crear({ estadoStock: 'SIN_STOCK' }));

      expect(component.disponible()).toBeFalse();
    });
  });

  describe('Badge de clasificacion de salud', () => {
    it('dado un producto con clasificaciones, cuando renderizo, deberia mostrar el badge con su descripcion', () => {
      const badge = fixture.debugElement.query(By.css('.producto-card__badge'));
      expect(badge).not.toBeNull();
      expect((badge.nativeElement as HTMLElement).textContent).toContain('Sin TACC');
    });

    it('dado un producto sin clasificaciones, cuando renderizo, no deberia mostrar el badge', () => {
      givenInput('producto', ProductoMother.crear({ clasificacionesSalud: [] }));

      thenElSelectorNoExiste('.producto-card__badge');
    });

    it('dado mostrarCandado=true, cuando renderizo, deberia aplicar el shift al badge', () => {
      givenInput('mostrarCandado', true);

      const badge = fixture.debugElement.query(By.css('.producto-card__badge')).nativeElement as HTMLElement;
      expect(badge.classList.contains('producto-card__badge--shifted')).toBeTrue();
    });
  });

  function givenInput(nombre: string, valor: unknown): void {
    fixture.componentRef.setInput(nombre, valor);
    fixture.detectChanges();
  }

  function whenSeClickeaSelector(selector: string): void {
    fixture.debugElement.query(By.css(selector)).triggerEventHandler('click', new MouseEvent('click'));
  }

  function thenElSelectorExiste(selector: string): void {
    expect(fixture.debugElement.query(By.css(selector))).not.toBeNull();
  }

  function thenElSelectorNoExiste(selector: string): void {
    expect(fixture.debugElement.query(By.css(selector))).toBeNull();
  }
});
