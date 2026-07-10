import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { TrackingPedidosService } from './services/tracking-pedidos.service';
import { ScheduledPickup, EstadoCompra, EstadoRetiro, TimeSlotFilter } from './models/tracking-pedidos.model';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';

interface TrackingMetric {
  label: string;
  value: string;
  icon: string;
  tone?: 'success' | 'warning' | 'danger';
}

interface TrackingPedidosFilters {
  fecha?: string;
  status?: EstadoCompra;
  estadoRetiro?: EstadoRetiro;
  franjaId?: string;
  search?: string;
}

const ESTADOS_COMPRA: readonly EstadoCompra[] = [
  'PENDIENTE',
  'EN_PREPARACION',
  'LISTO',
  'ENTREGADO',
  'CANCELADO',
  'RECHAZADO',
  'VENCIDO',
];

const ESTADOS_RETIRO: readonly EstadoRetiro[] = [
  'PROGRAMADO',
  'LISTO',
  'RETIRADO',
  'NO_RETIRADO',
  'CANCELADO',
];

@Component({
  selector: 'app-tracking-pedidos-page',
  standalone: true,
  imports: [
    NavbarComponent,
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    OrderDetailsModalComponent,
  ],
  templateUrl: './tracking-pedidos.page.html',
  styleUrl: './tracking-pedidos.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackingPedidosPage implements OnInit {
  private readonly trackingService = inject(TrackingPedidosService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private requestSeq = 0;
  protected readonly userName = computed(() => this.usuarioService.getUsuarioActual().nombre);
  protected readonly loading = signal<boolean>(false);
  protected readonly isUpdating = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);
  protected readonly allPickupsState = signal<ScheduledPickup[]>([]);
  protected readonly filterFecha = signal<string>('');
  protected readonly filterEstado = signal<EstadoCompra | ''>('');
  protected readonly filterEstadoRetiro = signal<EstadoRetiro | ''>('');
  protected readonly filterFranja = signal<string>('');
  protected readonly filterSearch = signal<string>('');
  protected readonly selectedOrder = signal<ScheduledPickup | null>(null);
  protected readonly metrics = computed<TrackingMetric[]>(() => {
    const pickups = this.allPickupsState();
    const pending = pickups.filter((p) => p.status === 'PENDIENTE').length;
    const ready = pickups.filter((p) => p.status === 'LISTO').length;
    const expired = pickups.filter((p) => p.status === 'VENCIDO').length;

    return [
      {
        label: 'A preparar',
        value: this.formatNumber(pending),
        icon: 'fa-hourglass-half',
        tone: pending > 0 ? 'warning' : 'success',
      },
      {
        label: 'Ya listos',
        value: this.formatNumber(ready),
        icon: 'fa-bell-concierge',
        tone: ready > 0 ? 'warning' : 'success',
      },
      {
        label: 'Vencidos',
        value: this.formatNumber(expired),
        icon: 'fa-clock-rotate-left',
        tone: expired > 0 ? 'danger' : 'success',
      },
      {
        label: 'Resultado actual',
        value: this.formatNumber(this.filteredPickups().length),
        icon: 'fa-filter',
      },
    ];
  });
  protected readonly activeFiltersLabel = computed(() => {
    const labels: string[] = [];

    if (this.filterFecha()) {
      labels.push(this.formatDate(this.filterFecha()));
    }
    if (this.filterEstado()) {
      labels.push(this.getEstadoCompraLabel(this.filterEstado()));
    }
    if (this.filterEstadoRetiro()) {
      labels.push(this.getEstadoRetiroLabel(this.filterEstadoRetiro()));
    }
    if (this.filterFranja()) {
      const slot = this.timeSlots().find((item) => item.id === this.filterFranja());
      labels.push(slot?.description ?? 'Franja seleccionada');
    }
    if (this.filterSearch().trim()) {
      labels.push(`Busqueda: ${this.filterSearch().trim()}`);
    }

    return labels.length ? labels.join(' - ') : 'Sin filtros aplicados';
  });
  protected readonly timeSlots = computed<TimeSlotFilter[]>(() => {
    const unique = new Map<string, string>();
    for (const p of this.allPickupsState()) {
      if (p.pickupSlotId && p.pickupSlotDescription) {
        unique.set(p.pickupSlotId, p.pickupSlotDescription);
      }
    }
    return Array.from(unique.entries()).map(([id, description]) => ({ id, description }));
  });

  protected readonly filteredPickups = computed<ScheduledPickup[]>(() => {
    let list = this.allPickupsState();
    const fecha = this.filterFecha();
    const estado = this.filterEstado();
    const estadoRetiro = this.filterEstadoRetiro();
    const franja = this.filterFranja();
    const search = this.filterSearch().trim().toLowerCase();

    if (fecha) {
      list = list.filter((p) => p.pickupDate === fecha);
    }
    if (estado) {
      list = list.filter((p) => p.status === estado);
    }
    if (estadoRetiro) {
      list = list.filter((p) => p.withdrawalStatus === estadoRetiro);
    }
    if (franja && franja !== 'TODAS') {
      list = list.filter((p) => p.pickupSlotId === franja);
    }
    if (search) {
      list = list.filter(
        (p) =>
          p.studentName.toLowerCase().includes(search) ||
          (p.withdrawalCode && p.withdrawalCode.toLowerCase().includes(search))
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');
    this.applyQueryFilters(this.route.snapshot.queryParamMap);
    this.loadPickups();

    if (this.route.queryParamMap) {
      this.route.queryParamMap.subscribe((queryParams) => {
        const orderId = queryParams.get('id');
        if (orderId && this.allPickupsState().length > 0) {
          const found = this.allPickupsState().find((p) => p.id === orderId);
          if (found) {
            this.selectedOrder.set(found);
          }
        }
      });
    }
  }

  protected loadPickups(): void {
    const requestId = ++this.requestSeq;
    this.loading.set(true);
    this.error.set(null);

    this.trackingService.getScheduledPickups(this.buildBackendFilters()).subscribe({
      next: (data) => {
        if (requestId !== this.requestSeq) {
          return;
        }

        const sorted = [...data].sort((a, b) => {
          const dateDiff = new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
          if (dateDiff !== 0) return dateDiff;
          return a.pickupSlotDescription.localeCompare(b.pickupSlotDescription);
        });

        this.allPickupsState.set(sorted);
        this.loading.set(false);

        const selected = this.selectedOrder();
        if (selected) {
          const updated = sorted.find((p) => p.id === selected.id);
          this.selectedOrder.set(updated ?? null);
        }

        // Check if there is an order ID in query params to open the modal
        const orderId = this.route.snapshot?.queryParamMap?.get('id');
        if (orderId) {
          const found = sorted.find((p) => p.id === orderId);
          if (found) {
            this.selectedOrder.set(found);
          }
        }
      },
      error: (err) => {
        if (requestId !== this.requestSeq) {
          return;
        }

        console.error('Error fetching pickups:', err);
        this.error.set('No se pudieron cargar los pedidos. Por favor, intente de nuevo.');
        this.loading.set(false);
      },
    });
  }

  protected onVerDetalles(order: ScheduledPickup): void {
    this.selectedOrder.set(order);
  }

  protected onCerrarModal(): void {
    this.selectedOrder.set(null);
  }

  protected onAdvanceStatus(event: { orderId: string; nextStatus: EstadoCompra }): void {
    this.isUpdating.set(true);
    this.trackingService.advanceOrderStatus(event.orderId, event.nextStatus).subscribe({
      next: () => {
        this.toastService.mostrar(`Estado del pedido actualizado a: ${event.nextStatus}`, 'success');
        this.isUpdating.set(false);
        this.loadPickups();
      },
      error: (err) => {
        console.error('Error advancing status:', err);
        this.toastService.mostrar('Error al cambiar el estado del pedido', 'error');
        this.isUpdating.set(false);
      },
    });
  }

  protected onCancelOrder(orderId: string): void {
    this.isUpdating.set(true);
    this.trackingService.cancelOrder(orderId).subscribe({
      next: () => {
        this.toastService.mostrar('Pedido cancelado y saldo reembolsado', 'success');
        this.isUpdating.set(false);
        this.onCerrarModal();
        this.loadPickups();
      },
      error: (err) => {
        console.error('Error cancelling order:', err);
        this.toastService.mostrar('Error al cancelar el pedido', 'error');
        this.isUpdating.set(false);
      },
    });
  }

  protected limpiarFiltros(): void {
    this.filterFecha.set('');
    this.filterEstado.set('');
    this.filterEstadoRetiro.set('');
    this.filterFranja.set('');
    this.filterSearch.set('');
    this.loadPickups();
  }

  protected volverHome(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  protected getItemsSummary(order: ScheduledPickup): string {
    return order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ');
  }

  protected getCantidadItems(order: ScheduledPickup): number {
    if (!order.items) return 0;
    return order.items.reduce((acc, i) => acc + i.quantity, 0);
  }

  protected onFechaChange(value: string): void {
    this.filterFecha.set(value);
    this.loadPickups();
  }

  protected onFranjaChange(value: string): void {
    this.filterFranja.set(value);
    this.loadPickups();
  }

  protected onSearchChange(value: string): void {
    this.filterSearch.set(value);
  }

  protected onEstadoCompraChange(value: string): void {
    this.filterEstado.set(this.isEstadoCompra(value) ? value : '');
    this.loadPickups();
  }

  protected onEstadoRetiroChange(value: string): void {
    this.filterEstadoRetiro.set(this.isEstadoRetiro(value) ? value : '');
    this.loadPickups();
  }

  protected statusBadgeClass(status: EstadoCompra): string {
    return `tp-status tp-status--${status.toLowerCase()}`;
  }

  protected getEstadoCompraLabel(status: EstadoCompra | ''): string {
    const labels: Record<EstadoCompra, string> = {
      PENDIENTE: 'A preparar',
      EN_PREPARACION: 'En preparación',
      LISTO: 'Listo para retirar',
      ENTREGADO: 'Entregado',
      CANCELADO: 'Cancelado',
      RECHAZADO: 'Rechazado',
      VENCIDO: 'Vencido',
    };

    return status ? labels[status] : 'Todos los pedidos';
  }

  protected getEstadoRetiroLabel(status: EstadoRetiro | ''): string {
    const labels: Record<EstadoRetiro, string> = {
      PROGRAMADO: 'Retiro programado',
      LISTO: 'Retiro listo',
      RETIRADO: 'Retirado',
      NO_RETIRADO: 'No retirado',
      CANCELADO: 'Retiro cancelado',
    };

    return status ? labels[status] : 'Todos los retiros';
  }

  private applyQueryFilters(params: ParamMap): void {
    const fecha = params.get('date') ?? params.get('fecha');
    const estado = params.get('status') ?? params.get('estado');
    const estadoRetiro = params.get('withdrawalStatus') ?? params.get('estadoRetiro');
    const franja = params.get('franja') ?? params.get('franjaId');
    const search = params.get('search');

    if (fecha) {
      this.filterFecha.set(fecha);
    }
    if (this.isEstadoCompra(estado)) {
      this.filterEstado.set(estado);
    }
    if (this.isEstadoRetiro(estadoRetiro)) {
      this.filterEstadoRetiro.set(estadoRetiro);
    }
    if (franja) {
      this.filterFranja.set(franja);
    }
    if (search) {
      this.filterSearch.set(search);
    }
  }

  private buildBackendFilters(): TrackingPedidosFilters | undefined {
    const filters: TrackingPedidosFilters = {};
    const fecha = this.filterFecha();
    const status = this.filterEstado();
    const estadoRetiro = this.filterEstadoRetiro();
    const franjaId = this.filterFranja();
    const search = this.filterSearch().trim();

    if (fecha) {
      filters.fecha = fecha;
    }
    if (status) {
      filters.status = status;
    }
    if (estadoRetiro) {
      filters.estadoRetiro = estadoRetiro;
    }
    if (franjaId) {
      filters.franjaId = franjaId;
    }
    if (search) {
      filters.search = search;
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private isEstadoCompra(value: string | null | undefined): value is EstadoCompra {
    return ESTADOS_COMPRA.includes(value as EstadoCompra);
  }

  private isEstadoRetiro(value: string | null | undefined): value is EstadoRetiro {
    return ESTADOS_RETIRO.includes(value as EstadoRetiro);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('es-AR').format(value);
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
      return value;
    }

    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
}
