import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProductoCardComponent } from './producto-card.component';
import { CarritoService } from '../../../compra/services/carrito.service';
import { Producto } from '../../models/producto.model';

describe('ProductoCardComponent', () => {
  let component: ProductoCardComponent;
  let fixture: ComponentFixture<ProductoCardComponent>;
  let carritoServiceSpy: jasmine.SpyObj<CarritoService>;

  const mockProductoBase: Producto = {
    id: 'prod-123',
    nombre: 'Sándwich de Jamón y Queso',
    descripcion: 'Delicioso tostado de jamón y queso',
    precio: 1200,
    categoria: { id: 'comidas', descripcion: 'Comidas' },
    clasificacionesSalud: [{ id: 'sin-tacc', descripcion: 'Sin TACC' }],
    imagen: 'sandwich.jpg',
    estadoStock: 'DISPONIBLE',
  };

  beforeEach(async () => {
    carritoServiceSpy = jasmine.createSpyObj<CarritoService>('CarritoService', ['cantidadDe', 'puedeAgregar', 'validarAgregar']);
    carritoServiceSpy.cantidadDe.and.returnValue(0);
    carritoServiceSpy.puedeAgregar.and.callFake((prod) => !prod.superaPresupuesto);
    carritoServiceSpy.validarAgregar.and.callFake((prod) => ({ permitido: !prod.superaPresupuesto, razon: prod.superaPresupuesto ? 'presupuesto' : undefined }));

    await TestBed.configureTestingModule({
      imports: [ProductoCardComponent],
      providers: [{ provide: CarritoService, useValue: carritoServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductoCardComponent);
    component = fixture.componentInstance;
    component.producto = { ...mockProductoBase };
    component.alumnoId = 'alumno-abc';
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  // ── Candado / bloqueo por tutor ────────────────────────────────────────────

  describe('Bloqueo manual por el tutor (candado)', () => {
    it('no debería mostrar el botón del candado si mostrarCandado es false', () => {
      fixture.componentRef.setInput('mostrarCandado', false);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.producto-card__lock-btn'))).toBeNull();
    });

    it('debería mostrar el botón del candado si mostrarCandado es true', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.producto-card__lock-btn'))).not.toBeNull();
    });

    it('debería mostrar el candado abierto si el producto no está bloqueado por el tutor', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.componentRef.setInput('producto', { ...mockProductoBase, bloqueado: false });
      fixture.detectChanges();

      const lockIcon = fixture.debugElement.query(By.css('.producto-card__lock-btn i'));
      expect(lockIcon.nativeElement.classList.contains('fa-lock-open')).toBeTrue();
      expect(lockIcon.nativeElement.classList.contains('fa-lock')).toBeFalse();
    });

    it('debería mostrar el candado cerrado y la clase bloqueado si el tutor lo bloqueó', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueado: true,
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn'));
      expect(lockBtn.nativeElement.classList.contains('producto-card__lock-btn--bloqueado')).toBeTrue();
      expect(lockBtn.query(By.css('i')).nativeElement.classList.contains('fa-lock')).toBeTrue();
    });

    it('debería mostrar el botón "Bloqueado por el tutor" y deshabilitado si fue bloqueado por el tutor', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueado: true,
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta'));
      expect(ctaBtn.nativeElement.disabled).toBeTrue();
      expect(ctaBtn.nativeElement.textContent).toContain('Bloqueado por el tutor');
    });

    it('debería aplicar la clase producto-card--bloqueado solo al producto bloqueado por el tutor', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueado: true,
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const card = fixture.debugElement.query(By.css('.producto-card'));
      expect(card.nativeElement.classList.contains('producto-card--bloqueado')).toBeTrue();
      expect(card.nativeElement.classList.contains('producto-card--restringido')).toBeFalse();
    });

    it('debería emitir el evento toggleLock al hacer clic en el candado', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.detectChanges();

      spyOn(component.toggleLock, 'emit');
      fixture.debugElement.query(By.css('.producto-card__lock-btn'))
        .triggerEventHandler('click', new MouseEvent('click'));

      expect(component.toggleLock.emit).toHaveBeenCalled();
    });
  });

  // ── Bloqueo por restricción nutricional / horaria ─────────────────────────

  describe('Bloqueo por restricción nutricional o horaria', () => {
    it('debería mostrar el botón "No apto: Contiene TACC" para restricción de TACC', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC)',
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido'));
      expect(ctaBtn).not.toBeNull();
      expect(ctaBtn.nativeElement.disabled).toBeTrue();
      expect(ctaBtn.nativeElement.textContent).toContain('No apto: Contiene TACC');
    });

    it('debería mostrar "No apto: Contiene Azúcar" para restricción de azúcar', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Azúcar',
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido'));
      expect(ctaBtn.nativeElement.textContent).toContain('No apto: Contiene Azúcar');
    });

    it('debería mostrar "No apto: Contiene Lácteos" para restricción de lácteos', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Lácteos',
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido'));
      expect(ctaBtn.nativeElement.textContent).toContain('No apto: Contiene Lácteos');
    });

    it('debería mostrar múltiples restricciones unidas con " · "', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC), Lácteos',
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido'));
      expect(ctaBtn.nativeElement.textContent).toContain('No apto: Contiene TACC · Contiene Lácteos');
    });

    it('debería aplicar la clase producto-card--restringido y NO producto-card--bloqueado', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC)',
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const card = fixture.debugElement.query(By.css('.producto-card'));
      expect(card.nativeElement.classList.contains('producto-card--restringido')).toBeTrue();
      expect(card.nativeElement.classList.contains('producto-card--bloqueado')).toBeFalse();
    });

    it('debería mostrar "No Vegano" para restricción de ingredientes de origen animal', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Ingredientes de origen animal',
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();

      const ctaBtn = fixture.debugElement.query(By.css('.producto-card__cta--restringido'));
      expect(ctaBtn.nativeElement.textContent).toContain('No Vegano');
    });

    it('el candado NO debe aparecer cuando el bloqueo es por restricción nutricional', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        motivoBloqueo: 'Contiene: Gluten (TACC)',
        estadoStock: 'SIN_STOCK',
        bloqueado: false
      });
      fixture.detectChanges();

      const lockBtn = fixture.debugElement.query(By.css('.producto-card__lock-btn'));
      // El botón del candado existe pero debe mostrar candado abierto (producto.bloqueado = false)
      expect(lockBtn.nativeElement.classList.contains('producto-card__lock-btn--bloqueado')).toBeFalse();
    });
  });

  // ── Computed mensajeRestriccion ────────────────────────────────────────────

  describe('mensajeRestriccion()', () => {
    it('debería retornar "No apto" si no hay motivoBloqueo', () => {
      fixture.componentRef.setInput('producto', { ...mockProductoBase });
      fixture.detectChanges();
      expect(component.mensajeRestriccion()).toBe('No apto');
    });

    it('debería mapear "Gluten (TACC)" a "No apto: Contiene TACC"', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        motivoBloqueo: 'Contiene: Gluten (TACC)'
      });
      fixture.detectChanges();
      expect(component.mensajeRestriccion()).toBe('No apto: Contiene TACC');
    });

    it('debería mapear "Azúcar" a "No apto: Contiene Azúcar"', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        motivoBloqueo: 'Contiene: Azúcar'
      });
      fixture.detectChanges();
      expect(component.mensajeRestriccion()).toBe('No apto: Contiene Azúcar');
    });

    it('debería mapear "Lácteos" a "No apto: Contiene Lácteos"', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        motivoBloqueo: 'Contiene: Lácteos'
      });
      fixture.detectChanges();
      expect(component.mensajeRestriccion()).toBe('No apto: Contiene Lácteos');
    });

    it('debería mapear "Alto Sodio" a "No apto: Contiene Sodio"', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        motivoBloqueo: 'Contiene: Alto Sodio'
      });
      fixture.detectChanges();
      expect(component.mensajeRestriccion()).toBe('No apto: Contiene Sodio');
    });

    it('debería mapear "Ingredientes de origen animal" a "No apto: No Vegano"', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        motivoBloqueo: 'Contiene: Ingredientes de origen animal'
      });
      fixture.detectChanges();
      expect(component.mensajeRestriccion()).toBe('No apto: No Vegano');
    });

    it('debería unir múltiples restricciones con " · "', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        motivoBloqueo: 'Contiene: Gluten (TACC), Lácteos'
      });
      fixture.detectChanges();
      expect(component.mensajeRestriccion()).toBe('No apto: Contiene TACC · Contiene Lácteos');
    });
  });

  // ── Computed disponible ────────────────────────────────────────────────────

  describe('disponible()', () => {
    it('debería ser true para un producto disponible sin bloqueos', () => {
      fixture.componentRef.setInput('producto', { ...mockProductoBase, estadoStock: 'DISPONIBLE' });
      fixture.detectChanges();
      expect(component.disponible()).toBeTrue();
    });

    it('debería ser false si el producto está bloqueado por el tutor', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueado: true,
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();
      expect(component.disponible()).toBeFalse();
    });

    it('debería ser false si el producto está bloqueado por restricción nutricional', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        bloqueadoPorRestriccion: true,
        estadoStock: 'SIN_STOCK'
      });
      fixture.detectChanges();
      expect(component.disponible()).toBeFalse();
    });

    it('debería ser false si el producto supera el presupuesto', () => {
      fixture.componentRef.setInput('producto', {
        ...mockProductoBase,
        superaPresupuesto: true,
        estadoStock: 'DISPONIBLE'
      });
      fixture.detectChanges();
      expect(component.disponible()).toBeFalse();
    });

    it('debería ser false si el estadoStock es SIN_STOCK sin otros bloqueos', () => {
      fixture.componentRef.setInput('producto', { ...mockProductoBase, estadoStock: 'SIN_STOCK' });
      fixture.detectChanges();
      expect(component.disponible()).toBeFalse();
    });
  });

  // ── Badge de clasificación ─────────────────────────────────────────────────

  describe('Badge de clasificación de salud', () => {
    it('debería mostrar el badge si el producto tiene clasificaciones de salud', () => {
      fixture.detectChanges();
      const badge = fixture.debugElement.query(By.css('.producto-card__badge'));
      expect(badge).not.toBeNull();
      expect(badge.nativeElement.textContent).toContain('Sin TACC');
    });

    it('no debería mostrar el badge si el producto no tiene clasificaciones de salud', () => {
      fixture.componentRef.setInput('producto', { ...mockProductoBase, clasificacionesSalud: [] });
      fixture.detectChanges();
      const badge = fixture.debugElement.query(By.css('.producto-card__badge'));
      expect(badge).toBeNull();
    });

    it('debería desplazar el badge si mostrarCandado es true', () => {
      fixture.componentRef.setInput('mostrarCandado', true);
      fixture.detectChanges();
      const badge = fixture.debugElement.query(By.css('.producto-card__badge'));
      expect(badge.nativeElement.classList.contains('producto-card__badge--shifted')).toBeTrue();
    });
  });
});
