import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ProductoService } from '../../../inventario/services/producto.service';
import { PromotionService } from '../../../../data-access/services/promociones/promotion.service';
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

  function givenVistaTutor(): void {
    component.esVistaAlumno = false;
  }

  function givenMovimiento(movimiento: Movimiento): void {
    component.movimiento = movimiento;
  }
});
