import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastService } from '../../shared/services/toast.service';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { EstadoCompra, ScheduledPickup } from './models/tracking-pedidos.model';
import { TrackingPedidosService } from './services/tracking-pedidos.service';
import { ScheduledPickupMother } from './tracking-pedidos.mother';
import { TrackingPedidosPage } from './tracking-pedidos.page';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStub {
  @Input() userName = '';
}

@Component({ selector: 'app-order-details-modal', template: '', standalone: true })
class OrderDetailsModalStub {
  @Input() order!: ScheduledPickup;
  @Input() isUpdating = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() advanceStatus = new EventEmitter<{ orderId: string; nextStatus: EstadoCompra }>();
  @Output() cancelOrder = new EventEmitter<string>();
}

describe('TrackingPedidos Integration', () => {
  let fixture: ComponentFixture<TrackingPedidosPage>;
  let trackingService: jasmine.SpyObj<TrackingPedidosService>;

  beforeEach(async () => {
    trackingService = jasmine.createSpyObj<TrackingPedidosService>('TrackingPedidosService', [
      'getScheduledPickups',
      'advanceOrderStatus',
      'cancelOrder',
    ]);
    trackingService.advanceOrderStatus.and.returnValue(of({}));
    trackingService.cancelOrder.and.returnValue(of({}));

    const usuarioService = jasmine.createSpyObj<UsuarioService>('UsuarioService', [
      'getUsuarioActual',
      'setHomeUrl',
    ]);
    usuarioService.getUsuarioActual.and.returnValue({ id: 'u-1', nombre: 'Kiosquero Test' });

    await TestBed.configureTestingModule({
      imports: [TrackingPedidosPage],
      providers: [
        { provide: TrackingPedidosService, useValue: trackingService },
        { provide: UsuarioService, useValue: usuarioService },
        { provide: ToastService, useValue: jasmine.createSpyObj<ToastService>('ToastService', ['mostrar']) },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigateByUrl']) },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    })
      .overrideComponent(TrackingPedidosPage, {
        remove: { imports: [NavbarComponent, OrderDetailsModalComponent] },
        add: { imports: [NavbarStub, OrderDetailsModalStub] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TrackingPedidosPage);
  });

  it('dado que el back devuelve pickups, cuando se monta la page, deberia mostrar el titulo y las metricas', () => {
    givenPickupsDelBack(ScheduledPickupMother.crearVarios());

    whenMonto();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('#tracking-title')?.textContent).toContain('Seguimiento de pedidos');
    const metricas = html.querySelectorAll('.tp-metric');
    expect(metricas.length).toBeGreaterThan(0);
  });

  it('dado que no hay pickups, cuando se monta la page, no deberia romper el render', () => {
    givenPickupsDelBack([]);

    whenMonto();

    expect(fixture.componentInstance).toBeTruthy();
    expect(trackingService.getScheduledPickups).toHaveBeenCalled();
  });

  function givenPickupsDelBack(pickups: ScheduledPickup[]): void {
    trackingService.getScheduledPickups.and.returnValue(of(pickups));
  }

  function whenMonto(): void {
    fixture.detectChanges();
  }
});
