import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { TrackingPedidosService } from './services/tracking-pedidos.service';
import { ScheduledPickup, EstadoCompra, EstadoRetiro, TimeSlotFilter } from './models/tracking-pedidos.model';
import { OrderDetailsModalComponent } from './components/order-details-modal/order-details-modal.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-tracking-pedidos-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    NavbarComponent,
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

  // States
  protected readonly userName = computed(() => this.usuarioService.getUsuarioActual().nombre);
  protected readonly loading = signal<boolean>(false);
  protected readonly isUpdating = signal<boolean>(false);
  protected readonly error = signal<string | null>(null);

  // Pedidos cargados
  protected readonly allPickupsState = signal<ScheduledPickup[]>([]);

  // Filtros
  protected readonly filterFecha = signal<string>('');
  protected readonly filterEstado = signal<string>('');
  protected readonly filterFranja = signal<string>('');
  protected readonly filterSearch = signal<string>('');

  // Pedido seleccionado para ver detalles
  protected readonly selectedOrder = signal<ScheduledPickup | null>(null);

  // Extraer las franjas horarias de forma dinámica de los pedidos cargados
  protected readonly timeSlots = computed<TimeSlotFilter[]>(() => {
    const unique = new Map<string, string>();
    for (const p of this.allPickupsState()) {
      if (p.pickupSlotId && p.pickupSlotDescription) {
        unique.set(p.pickupSlotId, p.pickupSlotDescription);
      }
    }
    return Array.from(unique.entries()).map(([id, description]) => ({ id, description }));
  });

  // Filtrar localmente en el frontend para respuesta ultra-rápida y dinámica
  protected readonly filteredPickups = computed<ScheduledPickup[]>(() => {
    let list = this.allPickupsState();
    const fecha = this.filterFecha();
    const estado = this.filterEstado();
    const franja = this.filterFranja();
    const search = this.filterSearch().trim().toLowerCase();

    if (fecha) {
      list = list.filter((p) => p.pickupDate === fecha);
    }
    if (estado && estado !== 'TODOS') {
      list = list.filter((p) => p.withdrawalStatus === estado);
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
    this.loadPickups();
  }

  protected loadPickups(): void {
    this.loading.set(true);
    this.error.set(null);

    // Hacemos el fetch de todos los pedidos programados del kiosquero para administrarlos fluidamente
    this.trackingService.getScheduledPickups().subscribe({
      next: (data) => {
        // Ordenar cronológicamente por fecha y franja de retiro (el backend ya los devuelve ordenados, pero aseguramos en el cliente)
        const sorted = [...data].sort((a, b) => {
          const dateDiff = new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
          if (dateDiff !== 0) return dateDiff;
          return a.pickupSlotDescription.localeCompare(b.pickupSlotDescription);
        });

        this.allPickupsState.set(sorted);
        this.loading.set(false);

        // Si hay un modal abierto, actualizar la referencia del pedido seleccionado para reflejar cambios
        const selected = this.selectedOrder();
        if (selected) {
          const updated = sorted.find((p) => p.id === selected.id);
          this.selectedOrder.set(updated ?? null);
        }
      },
      error: (err) => {
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
        this.loadPickups(); // Recarga la lista completa
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
        this.onCerrarModal(); // Cerrar modal al cancelar
        this.loadPickups(); // Recargar lista completa
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
    this.filterFranja.set('');
    this.filterSearch.set('');
  }

  protected volverHome(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  protected getItemsSummary(order: ScheduledPickup): string {
    return order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ');
  }
}
