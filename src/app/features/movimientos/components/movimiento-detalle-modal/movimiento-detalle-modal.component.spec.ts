import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { ProductoService } from '../../../inventario/services/producto.service';
import { Producto } from '../../../inventario/models/producto.interface';
import { Promotion, PromotionService } from '../../../../data-access/services/promociones/promotion.service';
import { MovimientoMother } from '../../movimientos.mother';
import { Movimiento } from '../../models/movimiento.model';
import { MovimientoDetalleModalComponent } from './movimiento-detalle-modal.component';

describe('MovimientoDetalleModalComponent', () => {
  let component: MovimientoDetalleModalComponent;
  let fixture: ComponentFixture<MovimientoDetalleModalComponent>;
  let servicioPromociones: jasmine.SpyObj<PromotionService>;
  let servicioProducto: jasmine.SpyObj<ProductoService>;

  beforeEach(async () => {
    servicioPromociones = jasmine.createSpyObj('PromotionService', ['getPromotionById']);
    servicioProducto = jasmine.createSpyObj('ProductoService', ['getById']);

    await TestBed.configureTestingModule({
      imports: [MovimientoDetalleModalComponent],
      providers: [
        { provide: PromotionService, useValue: servicioPromociones },
        { provide: ProductoService, useValue: servicioProducto },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MovimientoDetalleModalComponent);
    component = fixture.componentInstance;
    component.movimiento = MovimientoMother.crearAnticipada();
  });

  describe('puedoCancelar', () => {
    it('dado vista tutor con ANTICIPADA PENDIENTE, cuando lo consulto, deberia poder cancelar', () => {
      givenVistaTutor();
      givenMovimiento(MovimientoMother.crearAnticipada({ status: 'PENDIENTE' }));

      expect(component.puedoCancelar()).toBeTrue();
    });

    it('dado vista tutor con ANTICIPADA EN_PREPARACION, cuando lo consulto, deberia poder cancelar', () => {
      givenVistaTutor();
      givenMovimiento(MovimientoMother.crearAnticipada({ status: 'EN_PREPARACION' }));

      expect(component.puedoCancelar()).toBeTrue();
    });

    it('dado vista alumno, no deberia poder cancelar (aun si es ANTICIPADA y PENDIENTE)', () => {
      component.esVistaAlumno = true;
      givenMovimiento(MovimientoMother.crearAnticipada({ status: 'PENDIENTE' }));

      expect(component.puedoCancelar()).toBeFalse();
    });

    it('dado un tipo PRESENCIAL, no deberia poder cancelar', () => {
      givenVistaTutor();
      givenMovimiento(MovimientoMother.crearAnticipada({ tipo: 'PRESENCIAL', status: 'PENDIENTE' }));

      expect(component.puedoCancelar()).toBeFalse();
    });

    it('dado un estado CANCELADO, no deberia poder cancelar', () => {
      givenVistaTutor();
      givenMovimiento(MovimientoMother.crearAnticipada({ status: 'CANCELADO' }));

      expect(component.puedoCancelar()).toBeFalse();
    });
  });

  describe('esFechaLimiteSuperada', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-06-14T09:30:00-03:00'));
    });

    afterEach(() => jasmine.clock().uninstall());

    it('dado sin pickupDate o sin pickupSlotStartTime, deberia devolver false', () => {
      givenMovimiento(MovimientoMother.crearAnticipada({ pickupDate: undefined }));
      expect(component.esFechaLimiteSuperada()).toBeFalse();

      givenMovimiento(
        MovimientoMother.crearAnticipada({
          pickupDate: '2026-06-15',
          pickupSlotStartTime: undefined,
        }),
      );
      expect(component.esFechaLimiteSuperada()).toBeFalse();
    });

    it('dado que faltan mas de una hora para el retiro, deberia devolver false', () => {
      givenMovimiento(
        MovimientoMother.crearAnticipada({
          pickupDate: '2026-06-15',
          pickupSlotStartTime: '10:00',
        }),
      );

      expect(component.esFechaLimiteSuperada()).toBeFalse();
    });

    it('dado que falta exactamente una hora, deberia devolver true', () => {
      jasmine.clock().mockDate(new Date('2026-06-14T10:00:00-03:00'));
      givenMovimiento(
        MovimientoMother.crearAnticipada({
          pickupDate: '2026-06-14',
          pickupSlotStartTime: '11:00',
        }),
      );

      expect(component.esFechaLimiteSuperada()).toBeTrue();
    });

    it('dado que falta menos de una hora, deberia devolver true', () => {
      jasmine.clock().mockDate(new Date('2026-06-14T10:15:00-03:00'));
      givenMovimiento(
        MovimientoMother.crearAnticipada({
          pickupDate: '2026-06-14',
          pickupSlotStartTime: '11:00',
        }),
      );

      expect(component.esFechaLimiteSuperada()).toBeTrue();
    });

    it('dado que la hora de retiro ya paso, deberia devolver true', () => {
      jasmine.clock().mockDate(new Date('2026-06-14T11:30:00-03:00'));
      givenMovimiento(
        MovimientoMother.crearAnticipada({
          pickupDate: '2026-06-14',
          pickupSlotStartTime: '11:00',
        }),
      );

      expect(component.esFechaLimiteSuperada()).toBeTrue();
    });
  });

  describe('acciones en el DOM', () => {
    it('dado un movimiento cancelable con fecha limite superada, deberia deshabilitar el boton de cancelar', () => {
      givenVistaTutor();
      givenMovimiento(MovimientoMother.crearAnticipada({ status: 'PENDIENTE' }));
      spyOn(component, 'esFechaLimiteSuperada').and.returnValue(true);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.mov-modal__btn--danger'));
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.disabled).toBeTrue();
    });

    it('dado un movimiento cancelable sin fecha limite superada, deberia habilitar el boton de cancelar', () => {
      givenVistaTutor();
      givenMovimiento(MovimientoMother.crearAnticipada({ status: 'PENDIENTE' }));
      spyOn(component, 'esFechaLimiteSuperada').and.returnValue(false);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.mov-modal__btn--danger'));
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.disabled).toBeFalse();
    });

    it('dado el boton habilitado, cuando hago click en cancelar, deberia emitir cancelar con el id del movimiento', () => {
      spyOn(component.cancelar, 'emit');
      givenVistaTutor();
      givenMovimiento(MovimientoMother.crearAnticipada({ status: 'PENDIENTE' }));
      spyOn(component, 'esFechaLimiteSuperada').and.returnValue(false);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.mov-modal__btn--danger'));
      btn.nativeElement.click();

      expect(component.cancelar.emit).toHaveBeenCalledWith(component.movimiento.id);
    });
  });

  describe('formatos y fecha del movimiento', () => {
    it('dado un ANTICIPADA con pickupDate y slot, mostrarFecha deberia incluir slot + fecha formateada', () => {
      givenMovimiento(
        MovimientoMother.crearAnticipada({
          pickupDate: '2026-07-15',
          pickupSlotDescription: 'Primer recreo',
        }),
      );

      const texto = component.mostrarFecha(component.movimiento);
      expect(texto).toContain('Primer recreo');
      expect(texto).toContain('15');
    });

    it('dado un movimiento sin ANTICIPADA, mostrarFecha deberia usar el date del movimiento', () => {
      givenMovimiento(MovimientoMother.crear({ date: '2026-06-05T10:00:00Z' }));

      expect(component.mostrarFecha(component.movimiento)).toBeTruthy();
    });

    it('dado formatearPrecio, deberia incluir simbolo $', () => {
      const precio = component.formatearPrecio(1500);
      expect(precio).toContain('$');
    });

    it('dado formatearFechaProgramada con yyyy-MM-dd, deberia devolver dd/MM/yyyy', () => {
      expect(component.formatearFechaProgramada('2026-07-15')).toBe('15/07/2026');
    });

    it('dado formatearFechaProgramada con string vacio, deberia devolver string vacio', () => {
      expect(component.formatearFechaProgramada('')).toBe('');
    });
  });

  describe('esPromocion', () => {
    it('dado un nombre que empieza con "promo", deberia ser promocion', () => {
      expect(component.esPromocion('Promo Desayuno')).toBeTrue();
    });

    it('dado un nombre que empieza con "combo", deberia ser promocion', () => {
      expect(component.esPromocion('Combo Alfajor')).toBeTrue();
    });

    it('dado un nombre con "duo pack", deberia ser promocion', () => {
      expect(component.esPromocion('Duo Pack Oreo')).toBeTrue();
    });

    it('dado un nombre normal, no deberia ser promocion', () => {
      expect(component.esPromocion('Agua Mineral')).toBeFalse();
    });

    it('dado un nombre vacio, no deberia ser promocion', () => {
      expect(component.esPromocion('')).toBeFalse();
    });
  });

  describe('togglePromoDetails', () => {
    it('dado un promo id ya expandido, cuando toggleo, deberia colapsarlo', () => {
      component.expandedPromos.add('p1');

      component.togglePromoDetails('p1');

      expect(component.expandedPromos.has('p1')).toBeFalse();
    });

    it('dado promo ya cacheada, no deberia volver a pedirla', () => {
      component.promosLoaded.set('p1', { promotion: null, products: [], loading: false, error: false });

      component.togglePromoDetails('p1');

      expect(servicioPromociones.getPromotionById).not.toHaveBeenCalled();
    });

    it('dado un promo id nuevo, deberia pedir la promocion y cachearla', () => {
      servicioPromociones.getPromotionById.and.returnValue(of({
        id: 'p1',
        name: 'Combo',
        productIds: ['prod-1'],
        discountPercentage: 10,
      } as unknown as Promotion));
      servicioProducto.getById.and.returnValue(of({
        id: 'prod-1',
        nombre: 'Alfajor',
        precio: 500,
      } as unknown as Producto));

      component.togglePromoDetails('p1');

      expect(servicioPromociones.getPromotionById).toHaveBeenCalledWith('p1');
      expect(component.promosLoaded.get('p1')?.loading).toBeFalse();
      expect(component.promosLoaded.get('p1')?.products.length).toBe(1);
    });

    it('dado una promo sin productIds, deberia dejarla sin products pero cargada', () => {
      servicioPromociones.getPromotionById.and.returnValue(of({
        id: 'p1',
        name: 'Combo',
        productIds: [],
        discountPercentage: 0,
      } as unknown as Promotion));

      component.togglePromoDetails('p1');

      const data = component.promosLoaded.get('p1');
      expect(data?.loading).toBeFalse();
      expect(data?.error).toBeFalse();
      expect(data?.products).toEqual([]);
    });

    it('dado que un producto individual falla, deberia filtrarlo del resultado', () => {
      servicioPromociones.getPromotionById.and.returnValue(of({
        id: 'p1',
        name: 'Combo',
        productIds: ['prod-ok', 'prod-fail'],
        discountPercentage: 10,
      } as unknown as Promotion));
      servicioProducto.getById.and.callFake((id: string) => {
        if (id === 'prod-ok') return of({ id, nombre: 'X', precio: 100 } as unknown as Producto);
        return throwError(() => new Error('boom'));
      });

      component.togglePromoDetails('p1');

      expect(component.promosLoaded.get('p1')?.products.length).toBe(1);
    });

    it('dado que getPromotionById falla, deberia setear error true', () => {
      servicioPromociones.getPromotionById.and.returnValue(throwError(() => new Error('boom')));

      component.togglePromoDetails('p1');

      expect(component.promosLoaded.get('p1')?.error).toBeTrue();
      expect(component.promosLoaded.get('p1')?.loading).toBeFalse();
    });
  });

  describe('getPromoOriginalPrice / getPromoDiscountedPrice', () => {
    it('dado sin data cacheada, deberia devolver 0', () => {
      expect(component.getPromoOriginalPrice('no-existe')).toBe(0);
      expect(component.getPromoDiscountedPrice('no-existe')).toBe(0);
    });

    it('dado productos cacheados, deberia sumar precios para original', () => {
      component.promosLoaded.set('p1', {
        promotion: { id: 'p1', name: 'X', productIds: [], discountPercentage: 20 } as never,
        products: [
          { id: 'a', nombre: 'X', precio: 500 } as never,
          { id: 'b', nombre: 'Y', precio: 300 } as never,
        ],
        loading: false,
        error: false,
      });

      expect(component.getPromoOriginalPrice('p1')).toBe(800);
      expect(component.getPromoDiscountedPrice('p1')).toBe(640);
    });

    it('dado promo sin discountPercentage, deberia usar 0 de descuento', () => {
      component.promosLoaded.set('p1', {
        promotion: { id: 'p1', name: 'X', productIds: [], discountPercentage: 0 } as never,
        products: [{ id: 'a', nombre: 'X', precio: 500 } as never],
        loading: false,
        error: false,
      });

      expect(component.getPromoDiscountedPrice('p1')).toBe(500);
    });
  });

  describe('onCerrar / onOverlayClick / onKeyDown', () => {
    it('dado el modal, cuando llamo onCerrar, deberia emitir cerrar', () => {
      const spy = jasmine.createSpy('cerrar');
      component.cerrar.subscribe(spy);

      component.onCerrar();

      expect(spy).toHaveBeenCalled();
    });

    it('dado un click en el overlay (target === currentTarget), deberia cerrar', () => {
      const spy = jasmine.createSpy('cerrar');
      component.cerrar.subscribe(spy);
      const el = document.createElement('div');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: el });
      Object.defineProperty(event, 'currentTarget', { value: el });

      component.onOverlayClick(event);

      expect(spy).toHaveBeenCalled();
    });

    it('dado un click en un hijo del overlay, no deberia cerrar', () => {
      const spy = jasmine.createSpy('cerrar');
      component.cerrar.subscribe(spy);
      const overlay = document.createElement('div');
      const child = document.createElement('span');
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: child });
      Object.defineProperty(event, 'currentTarget', { value: overlay });

      component.onOverlayClick(event);

      expect(spy).not.toHaveBeenCalled();
    });

    it('dado Escape, cuando disparo onKeyDown, deberia cerrar', () => {
      const spy = jasmine.createSpy('cerrar');
      component.cerrar.subscribe(spy);
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    it('dado Enter, cuando disparo onKeyDown, deberia cerrar', () => {
      const spy = jasmine.createSpy('cerrar');
      component.cerrar.subscribe(spy);

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));

      expect(spy).toHaveBeenCalled();
    });

    it('dado Space, cuando disparo onKeyDown, deberia cerrar', () => {
      const spy = jasmine.createSpy('cerrar');
      component.cerrar.subscribe(spy);

      component.onKeyDown(new KeyboardEvent('keydown', { key: ' ' }));

      expect(spy).toHaveBeenCalled();
    });

    it('dado otra tecla, cuando disparo onKeyDown, no deberia cerrar', () => {
      const spy = jasmine.createSpy('cerrar');
      component.cerrar.subscribe(spy);

      component.onKeyDown(new KeyboardEvent('keydown', { key: 'a' }));

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('formatearFecha', () => {
    it('dado un date string valido, deberia devolver una fecha formateada', () => {
      const salida = component.formatearFecha('2026-07-15T14:30:00');

      expect(salida).toBeTruthy();
      expect(salida.length).toBeGreaterThan(0);
    });

    it('dado un string vacio, deberia devolver ""', () => {
      expect(component.formatearFecha('')).toBe('');
    });
  });

  describe('mostrarFecha edge cases', () => {
    it('dado ANTICIPADA con pickupDate mal formado, deberia devolver el string tal cual + slot', () => {
      const movimiento = MovimientoMother.crearAnticipada({
        pickupDate: 'FECHA-RARA',
        pickupSlotDescription: 'Recreo largo',
      });

      const texto = component.mostrarFecha(movimiento);

      expect(texto).toContain('FECHA-RARA');
      expect(texto).toContain('Recreo largo');
    });

    it('dado ANTICIPADA con pickupDate sin slot, deberia devolver solo la fecha', () => {
      const movimiento = MovimientoMother.crearAnticipada({
        pickupDate: '2026-07-15',
        pickupSlotDescription: undefined,
      });

      const texto = component.mostrarFecha(movimiento);

      expect(texto).toContain('15');
    });
  });

  function givenVistaTutor(): void {
    component.esVistaAlumno = false;
  }

  function givenMovimiento(movimiento: Movimiento): void {
    component.movimiento = movimiento;
  }
});
