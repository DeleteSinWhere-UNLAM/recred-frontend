import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrderDetailsModalComponent } from './order-details-modal.component';
import { CompraService } from '../../../compra/services/compra.service';
import { ScheduledPickup, EstadoCompra } from '../../models/tracking-pedidos.model';
import { By } from '@angular/platform-browser';

describe('OrderDetailsModalComponent', () => {
  let componente: OrderDetailsModalComponent;
  let fixture: ComponentFixture<OrderDetailsModalComponent>;
  let mockCompraService: jasmine.SpyObj<CompraService>;

  const baseOrder: ScheduledPickup = {
    id: 'ord-1',
    status: 'PENDIENTE',
    // Mock the rest of the required properties safely
  } as unknown as ScheduledPickup;

  beforeEach(async () => {
    mockCompraService = jasmine.createSpyObj('CompraService', ['deliver']);

    await TestBed.configureTestingModule({
      imports: [OrderDetailsModalComponent],
      providers: [
        { provide: CompraService, useValue: mockCompraService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailsModalComponent);
    componente = fixture.componentInstance;
  });

  describe('Inicialización y Computed Signals', () => {
    it('dado que el status es PENDIENTE, los computeds deben evaluar acordemente', () => {
      componente.order = { ...baseOrder, status: 'PENDIENTE' };
      fixture.detectChanges();

      expect(componente.nextStatusText()).toBe('Iniciar preparación');
      expect(componente.canAdvance()).toBeTrue();
      expect(componente.canCancel()).toBeTrue();
    });

    it('dado que el status es EN_PREPARACION, los computeds deben evaluar acordemente', () => {
      componente.order = { ...baseOrder, status: 'EN_PREPARACION' };
      fixture.detectChanges();

      expect(componente.nextStatusText()).toBe('Marcar como listo');
      expect(componente.canAdvance()).toBeTrue();
      expect(componente.canCancel()).toBeTrue();
    });

    it('dado que el status es LISTO, los computeds deben evaluar acordemente', () => {
      componente.order = { ...baseOrder, status: 'LISTO' };
      fixture.detectChanges();

      expect(componente.nextStatusText()).toBe('Entregar pedido');
      expect(componente.canAdvance()).toBeTrue();
      expect(componente.canCancel()).toBeTrue();
    });

    it('dado que el status es ENTREGADO, no debe permitir avance ni cancelacion', () => {
      componente.order = { ...baseOrder, status: 'ENTREGADO' };
      fixture.detectChanges();

      expect(componente.nextStatusText()).toBe('');
      expect(componente.canAdvance()).toBeFalse();
      expect(componente.canCancel()).toBeFalse();
    });
  });

  describe('Comportamiento de botones (Cancel, Close, Backdrop)', () => {
    beforeEach(() => {
      componente.order = baseOrder;
      fixture.detectChanges();
    });

    it('dado onClose, debe emitir closeModal si no esta actualizando', () => {
      spyOn(componente.closeModal, 'emit');
      componente.isUpdating = false;
      
      (componente as any).onClose();
      
      expect(componente.closeModal.emit).toHaveBeenCalled();
    });

    it('dado onClose, NO debe emitir closeModal si esta actualizando', () => {
      spyOn(componente.closeModal, 'emit');
      componente.isUpdating = true;
      
      (componente as any).onClose();
      
      expect(componente.closeModal.emit).not.toHaveBeenCalled();
    });

    it('dado onBackdropClick en el mismo target, debe cerrar', () => {
      spyOn(componente.closeModal, 'emit');
      const div = document.createElement('div');
      const event = { target: div, currentTarget: div } as unknown as MouseEvent;
      
      (componente as any).onBackdropClick(event);
      
      expect(componente.closeModal.emit).toHaveBeenCalled();
    });

    it('dado onCancel con confirmacion en true, debe emitir cancelOrder', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(componente.cancelOrder, 'emit');

      (componente as any).onCancel();

      expect(componente.cancelOrder.emit).toHaveBeenCalledWith('ord-1');
    });

    it('dado onCancel con confirmacion en false, NO debe emitir', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(componente.cancelOrder, 'emit');

      (componente as any).onCancel();

      expect(componente.cancelOrder.emit).not.toHaveBeenCalled();
    });
  });

  describe('Flujo de onAdvance y confirmDelivery', () => {
    it('dado onAdvance desde PENDIENTE, debe emitir EN_PREPARACION', () => {
      componente.order = { ...baseOrder, status: 'PENDIENTE' };
      spyOn(componente.advanceStatus, 'emit');

      (componente as any).onAdvance();

      expect(componente.advanceStatus.emit).toHaveBeenCalledWith({ orderId: 'ord-1', nextStatus: 'EN_PREPARACION' });
    });

    it('dado onAdvance desde EN_PREPARACION, debe emitir LISTO', () => {
      componente.order = { ...baseOrder, status: 'EN_PREPARACION' };
      spyOn(componente.advanceStatus, 'emit');

      (componente as any).onAdvance();

      expect(componente.advanceStatus.emit).toHaveBeenCalledWith({ orderId: 'ord-1', nextStatus: 'LISTO' });
    });

    it('dado onAdvance desde LISTO, NO debe emitir sino mostrar modal de verificacion', () => {
      componente.order = { ...baseOrder, status: 'LISTO' };
      spyOn(componente.advanceStatus, 'emit');

      expect(componente.showVerificationModal).toBeFalse();
      (componente as any).onAdvance();

      expect(componente.advanceStatus.emit).not.toHaveBeenCalled();
      expect(componente.showVerificationModal).toBeTrue();
    });

    it('dado confirmDelivery con codigo y success, debe emitir ENTREGADO y cerrar modal', () => {
      componente.order = { ...baseOrder, status: 'LISTO' };
      componente.showVerificationModal = true;
      componente.verificationCode = '1234';
      spyOn(componente.advanceStatus, 'emit');
      
      mockCompraService.deliver.and.returnValue(of(undefined));

      (componente as any).confirmDelivery();

      expect(mockCompraService.deliver).toHaveBeenCalledWith('ord-1', '1234');
      expect(componente.advanceStatus.emit).toHaveBeenCalledWith({ orderId: 'ord-1', nextStatus: 'ENTREGADO' });
      expect(componente.showVerificationModal).toBeFalse();
      expect(componente.verificationCode).toBe('');
    });

    it('dado confirmDelivery falla, debe mostrar alert', () => {
      componente.order = { ...baseOrder, status: 'LISTO' };
      componente.verificationCode = '1234';
      spyOn(window, 'alert');
      
      mockCompraService.deliver.and.returnValue(throwError(() => new Error('Error')));

      (componente as any).confirmDelivery();

      expect(window.alert).toHaveBeenCalledWith(jasmine.stringMatching('Código incorrecto'));
    });
  });
});
