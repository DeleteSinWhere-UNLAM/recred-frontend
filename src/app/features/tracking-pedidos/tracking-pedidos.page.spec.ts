import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TrackingPedidosPage } from './tracking-pedidos.page';
import { TrackingPedidosService } from './services/tracking-pedidos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ScheduledPickup } from './models/tracking-pedidos.model';
import { By } from '@angular/platform-browser';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  template: ''
})
class MockNavbarComponent {
  @Input() userName = '';
}

@Component({
  selector: 'app-order-details-modal',
  standalone: true,
  template: ''
})
class MockOrderDetailsModalComponent {
  @Input() order: any;
  @Input() isUpdating = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() advanceStatus = new EventEmitter<{ orderId: string; nextStatus: string }>();
  @Output() cancelOrder = new EventEmitter<string>();
}

describe('TrackingPedidosPage', () => {
  let componente: TrackingPedidosPage;
  let fixture: ComponentFixture<TrackingPedidosPage>;

  let mockTrackingService: jasmine.SpyObj<TrackingPedidosService>;
  let mockUsuarioService: jasmine.SpyObj<UsuarioService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockPickups: ScheduledPickup[] = [
    {
      id: '1',
      studentName: 'Ana Gomez',
      pickupDate: '2024-05-10',
      pickupSlotId: 'slot-1',
      pickupSlotDescription: 'Recreo 1',
      withdrawalStatus: 'PENDIENTE',
      status: 'PENDIENTE',
      withdrawalCode: 'A1B2',
      items: [{ productName: 'Alfajor', quantity: 2 }]
    } as unknown as ScheduledPickup,
    {
      id: '2',
      studentName: 'Beto Perez',
      pickupDate: '2024-05-11',
      pickupSlotId: 'slot-2',
      pickupSlotDescription: 'Recreo 2',
      withdrawalStatus: 'LISTO',
      status: 'LISTO',
      withdrawalCode: 'X9Y8',
      items: [{ productName: 'Jugo', quantity: 1 }]
    } as unknown as ScheduledPickup
  ];

  beforeEach(async () => {
    mockTrackingService = jasmine.createSpyObj('TrackingPedidosService', ['getScheduledPickups', 'advanceOrderStatus', 'cancelOrder']);
    mockUsuarioService = jasmine.createSpyObj('UsuarioService', ['getUsuarioActual', 'setHomeUrl']);
    mockToastService = jasmine.createSpyObj('ToastService', ['mostrar']);
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);

    mockUsuarioService.getUsuarioActual.and.returnValue({ nombre: 'Kiosquero Juan' } as any);

    await TestBed.configureTestingModule({
      imports: [TrackingPedidosPage],
      providers: [
        { provide: TrackingPedidosService, useValue: mockTrackingService },
        { provide: UsuarioService, useValue: mockUsuarioService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .overrideComponent(TrackingPedidosPage, {
      remove: { imports: [NavbarComponent, OrderDetailsModalComponent] },
      add: { imports: [MockNavbarComponent, MockOrderDetailsModalComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingPedidosPage);
    componente = fixture.componentInstance;
  });

  describe('Inicialización y carga', () => {
    it('dado que se inicializa, debe configurar home y cargar pickups ordenados', () => {
      mockTrackingService.getScheduledPickups.and.returnValue(of(mockPickups));

      fixture.detectChanges(); // ngOnInit

      expect(mockUsuarioService.setHomeUrl).toHaveBeenCalledWith('/kiosquero');
      expect(mockTrackingService.getScheduledPickups).toHaveBeenCalled();
      
      const state = (componente as any).allPickupsState();
      expect(state.length).toBe(2);
      // El orden debe ser Ana (10 de mayo) y luego Beto (11 de mayo)
      expect(state[0].id).toBe('1');
    });

    it('dado que falla la carga, debe mostrar mensaje de error', () => {
      spyOn(console, 'error');
      mockTrackingService.getScheduledPickups.and.returnValue(throwError(() => new Error('API down')));

      fixture.detectChanges();

      expect((componente as any).error()).toContain('No se pudieron cargar los pedidos');
      expect((componente as any).loading()).toBeFalse();
    });
  });

  describe('Comportamiento de Filtros Computados', () => {
    beforeEach(() => {
      mockTrackingService.getScheduledPickups.and.returnValue(of(mockPickups));
      fixture.detectChanges();
    });

    it('dado que no hay filtros, filteredPickups debe devolver todos', () => {
      expect((componente as any).filteredPickups().length).toBe(2);
    });

    it('dado filtro de fecha, debe retornar solo los coincidentes', () => {
      (componente as any).filterFecha.set('2024-05-10');
      expect((componente as any).filteredPickups().length).toBe(1);
      expect((componente as any).filteredPickups()[0].id).toBe('1');
    });

    it('dado filtro de estado distinto a TODOS, debe filtrar', () => {
      (componente as any).filterEstado.set('LISTO');
      expect((componente as any).filteredPickups().length).toBe(1);
      
      (componente as any).filterEstado.set('TODOS');
      expect((componente as any).filteredPickups().length).toBe(2);
    });

    it('dado filtro de franja, debe filtrar por slotId', () => {
      (componente as any).filterFranja.set('slot-2');
      expect((componente as any).filteredPickups().length).toBe(1);

      (componente as any).filterFranja.set('TODAS');
      expect((componente as any).filteredPickups().length).toBe(2);
    });

    it('dado filtro de search, debe filtrar por nombre de alumno o codigo ignorando caps', () => {
      (componente as any).filterSearch.set('BETO');
      expect((componente as any).filteredPickups().length).toBe(1);

      (componente as any).filterSearch.set('a1b2'); // Codigo de Ana
      expect((componente as any).filteredPickups().length).toBe(1);
      expect((componente as any).filteredPickups()[0].id).toBe('1');
    });

    it('dado limpiarFiltros, debe resetear todas las senales de filtros', () => {
      (componente as any).filterSearch.set('BETO');
      (componente as any).filterEstado.set('LISTO');
      
      (componente as any).limpiarFiltros();
      
      expect((componente as any).filterSearch()).toBe('');
      expect((componente as any).filterEstado()).toBe('');
      expect((componente as any).filteredPickups().length).toBe(2);
    });

    it('dado timeSlots, debe agrupar los ids unicos de franjas', () => {
      const slots = (componente as any).timeSlots();
      expect(slots.length).toBe(2);
      expect(slots[0].id).toBe('slot-1');
      expect(slots[0].description).toBe('Recreo 1');
    });
  });

  describe('Acciones e interacciones con modal', () => {
    beforeEach(() => {
      mockTrackingService.getScheduledPickups.and.returnValue(of(mockPickups));
      fixture.detectChanges();
    });

    it('dado onVerDetalles, debe setear selectedOrder', () => {
      (componente as any).onVerDetalles(mockPickups[0]);
      expect((componente as any).selectedOrder()).toEqual(mockPickups[0]);
    });

    it('dado onCerrarModal, debe nullificar selectedOrder', () => {
      (componente as any).selectedOrder.set(mockPickups[0]);
      (componente as any).onCerrarModal();
      expect((componente as any).selectedOrder()).toBeNull();
    });

    it('dado onAdvanceStatus exitoso, debe llamar servicio, toast y recargar', () => {
      mockTrackingService.advanceOrderStatus.and.returnValue(of(undefined));
      const evt = { orderId: '1', nextStatus: 'EN_PREPARACION' as const };
      
      (componente as any).onAdvanceStatus(evt);
      
      expect(mockTrackingService.advanceOrderStatus).toHaveBeenCalledWith('1', 'EN_PREPARACION');
      expect(mockToastService.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'success');
      expect(mockTrackingService.getScheduledPickups).toHaveBeenCalledTimes(2); // 1 en init, 1 recarga
    });

    it('dado onAdvanceStatus error, debe mostrar toast de error', () => {
      spyOn(console, 'error');
      mockTrackingService.advanceOrderStatus.and.returnValue(throwError(() => new Error('Error')));
      
      (componente as any).onAdvanceStatus({ orderId: '1', nextStatus: 'EN_PREPARACION' });
      
      expect(mockToastService.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'error');
    });

    it('dado onCancelOrder exitoso, debe llamar servicio, toast, cerrar modal y recargar', () => {
      mockTrackingService.cancelOrder.and.returnValue(of(undefined));
      (componente as any).selectedOrder.set(mockPickups[0]); // Simulo modal abierto
      
      (componente as any).onCancelOrder('1');
      
      expect(mockTrackingService.cancelOrder).toHaveBeenCalledWith('1');
      expect(mockToastService.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'success');
      expect((componente as any).selectedOrder()).toBeNull();
    });

    it('dado onCancelOrder error, debe mostrar toast de error', () => {
      spyOn(console, 'error');
      mockTrackingService.cancelOrder.and.returnValue(throwError(() => new Error('Err')));
      
      (componente as any).onCancelOrder('1');
      
      expect(mockToastService.mostrar).toHaveBeenCalledWith(jasmine.any(String), 'error');
    });

    it('dado volverHome, debe navegar usando router', () => {
      (componente as any).volverHome();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/kiosquero');
    });

    it('dado getItemsSummary, debe concatenar nombre y cantidad', () => {
      const summary = (componente as any).getItemsSummary(mockPickups[0]);
      expect(summary).toBe('Alfajor x2');
    });
  });
});
