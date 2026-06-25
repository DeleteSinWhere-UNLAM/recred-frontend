import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovimientoDetalleModalComponent } from './movimiento-detalle-modal.component';
import { Movimiento } from '../../models/movimiento.model';
import { By } from '@angular/platform-browser';
import { PromotionService } from '../../../../data-access/services/promociones/promotion.service';
import { ProductService } from '../../../../features/updated-inventory/services/product.service';

describe('MovimientoDetalleModalComponent', () => {
  let component: MovimientoDetalleModalComponent;
  let fixture: ComponentFixture<MovimientoDetalleModalComponent>;
  let mockPromotionService: jasmine.SpyObj<PromotionService>;
  let mockProductService: jasmine.SpyObj<ProductService>;

  const mockMovimiento: Movimiento = {
    id: 'mov-1',
    studentId: 'alumno-1',
    totalAmount: 1500,
    status: 'PENDIENTE',
    statusLabel: 'Pendiente',
    paymentMethod: 'DEBIT',
    date: '2026-06-05T10:00:00Z',
    items: [{ productId: 'prod-1', productName: 'Tostado', quantity: 1, unitPrice: 1500 }],
    tipo: 'ANTICIPADA',
    pickupDate: '2026-06-15',
    pickupSlotStartTime: '10:00'
  };

  beforeEach(async () => {
    mockPromotionService = jasmine.createSpyObj('PromotionService', ['getPromotionById']);
    mockProductService = jasmine.createSpyObj('ProductService', ['getById']);

    await TestBed.configureTestingModule({
      imports: [MovimientoDetalleModalComponent],
      providers: [
        { provide: PromotionService, useValue: mockPromotionService },
        { provide: ProductService, useValue: mockProductService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MovimientoDetalleModalComponent);
    component = fixture.componentInstance;
    component.movimiento = { ...mockMovimiento };
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('puedoCancelar', () => {
    it('debería retornar true si es vista tutor, tipo ANTICIPADA y estado PENDIENTE', () => {
      component.esVistaAlumno = false;
      component.movimiento.tipo = 'ANTICIPADA';
      component.movimiento.status = 'PENDIENTE';
      expect(component.puedoCancelar()).toBeTrue();
    });

    it('debería retornar true si es vista tutor, tipo ANTICIPADA y estado EN_PREPARACION', () => {
      component.esVistaAlumno = false;
      component.movimiento.tipo = 'ANTICIPADA';
      component.movimiento.status = 'EN_PREPARACION';
      expect(component.puedoCancelar()).toBeTrue();
    });

    it('debería retornar false si es vista alumno', () => {
      component.esVistaAlumno = true;
      component.movimiento.tipo = 'ANTICIPADA';
      component.movimiento.status = 'PENDIENTE';
      expect(component.puedoCancelar()).toBeFalse();
    });

    it('debería retornar false si el tipo no es ANTICIPADA', () => {
      component.esVistaAlumno = false;
      component.movimiento.tipo = 'PRESENCIAL';
      component.movimiento.status = 'PENDIENTE';
      expect(component.puedoCancelar()).toBeFalse();
    });

    it('debería retornar false si el estado no es PENDIENTE ni EN_PREPARACION', () => {
      component.esVistaAlumno = false;
      component.movimiento.tipo = 'ANTICIPADA';
      component.movimiento.status = 'CANCELADO';
      expect(component.puedoCancelar()).toBeFalse();
    });
  });

  describe('esFechaLimiteSuperada', () => {
    beforeEach(() => {
      jasmine.clock().install();
      jasmine.clock().mockDate(new Date('2026-06-14T09:30:00-03:00'));
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('debería retornar false si falta pickupDate o pickupSlotStartTime', () => {
      component.movimiento.pickupDate = undefined;
      expect(component.esFechaLimiteSuperada()).toBeFalse();

      component.movimiento.pickupDate = '2026-06-15';
      component.movimiento.pickupSlotStartTime = undefined;
      expect(component.esFechaLimiteSuperada()).toBeFalse();
    });

    it('debería retornar false si falta más de una hora para la franja de retiro', () => {
      component.movimiento.pickupDate = '2026-06-15';
      component.movimiento.pickupSlotStartTime = '10:00';
      expect(component.esFechaLimiteSuperada()).toBeFalse();
    });

    it('debería retornar true si falta exactamente una hora para la franja de retiro', () => {
      jasmine.clock().mockDate(new Date('2026-06-14T10:00:00-03:00'));
      component.movimiento.pickupDate = '2026-06-14';
      component.movimiento.pickupSlotStartTime = '11:00';
      expect(component.esFechaLimiteSuperada()).toBeTrue();
    });

    it('debería retornar true si falta menos de una hora para la franja de retiro', () => {
      jasmine.clock().mockDate(new Date('2026-06-14T10:15:00-03:00'));
      component.movimiento.pickupDate = '2026-06-14';
      component.movimiento.pickupSlotStartTime = '11:00';
      expect(component.esFechaLimiteSuperada()).toBeTrue();
    });

    it('debería retornar true si la hora de retiro ya pasó', () => {
      jasmine.clock().mockDate(new Date('2026-06-14T11:30:00-03:00'));
      component.movimiento.pickupDate = '2026-06-14';
      component.movimiento.pickupSlotStartTime = '11:00';
      expect(component.esFechaLimiteSuperada()).toBeTrue();
    });
  });

  describe('Acciones en el DOM', () => {
    it('debería deshabilitar el botón de cancelar si se superó la fecha límite', () => {
      component.esVistaAlumno = false;
      component.movimiento.tipo = 'ANTICIPADA';
      component.movimiento.status = 'PENDIENTE';
      
      spyOn(component, 'esFechaLimiteSuperada').and.returnValue(true);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.mov-modal__btn--danger'));
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.disabled).toBeTrue();
    });

    it('debería habilitar el botón de cancelar si NO se superó la fecha límite', () => {
      component.esVistaAlumno = false;
      component.movimiento.tipo = 'ANTICIPADA';
      component.movimiento.status = 'PENDIENTE';
      
      spyOn(component, 'esFechaLimiteSuperada').and.returnValue(false);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.mov-modal__btn--danger'));
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.disabled).toBeFalse();
    });

    it('debería emitir el evento cancelar al hacer clic en el botón habilitado', () => {
      spyOn(component.cancelar, 'emit');
      component.esVistaAlumno = false;
      component.movimiento.tipo = 'ANTICIPADA';
      component.movimiento.status = 'PENDIENTE';
      
      spyOn(component, 'esFechaLimiteSuperada').and.returnValue(false);
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('.mov-modal__btn--danger'));
      btn.nativeElement.click();

      expect(component.cancelar.emit).toHaveBeenCalledWith(component.movimiento.id);
    });
  });
});
