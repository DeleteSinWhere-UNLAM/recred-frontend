import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ToastService } from '../../../../shared/services/toast.service';
import { CompraService } from '../../../compra/services/compra.service';
import { ScheduledPickup } from '../../../tracking-pedidos/models/tracking-pedidos.model';
import { TrackingPedidosService } from '../../../tracking-pedidos/services/tracking-pedidos.service';
import { ScheduledPickupMother } from '../../../tracking-pedidos/tracking-pedidos.mother';
import { ModalVerificacionCodigoComponent } from './modal-verificacion-codigo.component';

describe('ModalVerificacionCodigoComponent', () => {
  let component: ModalVerificacionCodigoComponent;
  let fixture: ComponentFixture<ModalVerificacionCodigoComponent>;
  let trackingService: jasmine.SpyObj<TrackingPedidosService>;
  let compraService: jasmine.SpyObj<CompraService>;
  let toastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    trackingService = jasmine.createSpyObj<TrackingPedidosService>('TrackingPedidosService', [
      'getScheduledPickups',
      'advanceOrderStatus',
    ]);
    compraService = jasmine.createSpyObj<CompraService>('CompraService', ['deliver']);
    toastService = jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']);

    await TestBed.configureTestingModule({
      imports: [ModalVerificacionCodigoComponent],
      providers: [
        { provide: TrackingPedidosService, useValue: trackingService },
        { provide: CompraService, useValue: compraService },
        { provide: ToastService, useValue: toastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalVerificacionCodigoComponent);
    component = fixture.componentInstance;
  });

  describe('onCancel', () => {
    it('dado que no se esta enviando, cuando hago click en cancelar, deberia emitir closeModal', () => {
      spyOn(component.closeModal, 'emit');

      component.onCancel();

      expect(component.closeModal.emit).toHaveBeenCalled();
    });

    it('dado que se esta enviando, cuando hago click en cancelar, no deberia emitir closeModal', () => {
      spyOn(component.closeModal, 'emit');
      component.isSubmitting = true;

      component.onCancel();

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });
  });

  describe('onSearch', () => {
    it('dado un codigo vacio, cuando busco, no deberia llamar al service', () => {
      component.searchCode = '   ';

      component.onSearch();

      expect(trackingService.getScheduledPickups).not.toHaveBeenCalled();
    });

    it('dado un codigo con match exacto y estado LISTO, cuando busco, deberia pasar al estado CHECKLIST', () => {
      const pickup = ScheduledPickupMother.crear({
        withdrawalCode: 'ABC123',
        status: 'LISTO',
      });
      givenPickupsDelBack([pickup]);
      component.searchCode = 'abc123';

      component.onSearch();

      expect(component.order).toEqual(pickup);
      expect(component.currentState).toBe('CHECKLIST');
      expect(component.errorMessage).toBeNull();
    });

    it('dado que no hay match, cuando busco, deberia mostrar el mensaje de error', () => {
      givenPickupsDelBack([]);
      component.searchCode = 'NO_EXISTE';

      component.onSearch();

      expect(component.errorMessage).toContain('No se encontró');
      expect(component.currentState).toBe('BUSCAR');
    });

    it('dado un match con status ENTREGADO, cuando busco, deberia mostrar el mensaje "ya fue entregado"', () => {
      givenPickupsDelBack([
        ScheduledPickupMother.crear({
          withdrawalCode: 'ABC123',
          status: 'ENTREGADO',
          studentName: 'Juan',
        }),
      ]);
      component.searchCode = 'ABC123';

      component.onSearch();

      expect(component.errorMessage).toContain('ya fue entregado a Juan');
    });

    it('dado un match con status CANCELADO, cuando busco, deberia mostrar el estado en el error', () => {
      givenPickupsDelBack([
        ScheduledPickupMother.crear({
          withdrawalCode: 'ABC123',
          status: 'CANCELADO',
        }),
      ]);
      component.searchCode = 'ABC123';

      component.onSearch();

      expect(component.errorMessage?.toLowerCase()).toContain('cancelado');
    });

    it('dado que el service falla, cuando busco, deberia mostrar mensaje de error generico', () => {
      spyOn(console, 'error');
      trackingService.getScheduledPickups.and.returnValue(throwError(() => new Error('boom')));
      component.searchCode = 'ABC';

      component.onSearch();

      expect(component.errorMessage).toContain('Ocurrió un error');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('onConfirmDelivery', () => {
    beforeEach(() => {
      component.order = ScheduledPickupMother.crear({
        id: 'order-1',
        withdrawalCode: 'ABC123',
        status: 'LISTO',
      });
    });

    it('dado sin order cargada, cuando confirmo, no deberia llamar a los services', () => {
      component.order = null;

      component.onConfirmDelivery();

      expect(compraService.deliver).not.toHaveBeenCalled();
      expect(trackingService.advanceOrderStatus).not.toHaveBeenCalled();
    });

    it('dado order + deliver + advance OK, cuando confirmo, deberia pasar al estado EXITO y emitir orderDelivered', () => {
      spyOn(component.orderDelivered, 'emit');
      compraService.deliver.and.returnValue(of(undefined));
      trackingService.advanceOrderStatus.and.returnValue(of({}));

      component.onConfirmDelivery();

      expect(compraService.deliver).toHaveBeenCalledWith('order-1', 'ABC123');
      expect(trackingService.advanceOrderStatus).toHaveBeenCalledWith('order-1', 'ENTREGADO');
      expect(component.currentState).toBe('EXITO');
      expect(component.orderDelivered.emit).toHaveBeenCalled();
    });

    it('dado que deliver falla, cuando confirmo, deberia mostrar el mensaje de error y dejar isSubmitting en false', () => {
      spyOn(console, 'error');
      compraService.deliver.and.returnValue(throwError(() => new Error('bad')));

      component.onConfirmDelivery();

      expect(component.errorMessage).toContain('Error al validar');
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('resetModal', () => {
    it('dado un modal con estado CHECKLIST y datos, cuando reseteo, deberia volver a BUSCAR limpio', () => {
      component.currentState = 'CHECKLIST';
      component.searchCode = 'ABC';
      component.order = ScheduledPickupMother.crear();
      component.errorMessage = 'algo';

      component.resetModal();

      expect(component.currentState).toBe('BUSCAR');
      expect(component.searchCode).toBe('');
      expect(component.order).toBeNull();
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('getStatusLabel con estado desconocido', () => {
    it('dado un status no mapeado, deberia devolver el status crudo como fallback', () => {
      const priv = component as unknown as { getStatusLabel(s: string): string };

      expect(priv.getStatusLabel('ESTADO_INEXISTENTE')).toBe('ESTADO_INEXISTENTE');
    });
  });

  function givenPickupsDelBack(pickups: ScheduledPickup[]): void {
    trackingService.getScheduledPickups.and.returnValue(of(pickups));
  }
});
