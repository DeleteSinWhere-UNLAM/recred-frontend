import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Movimiento } from '../movimientos/models/movimiento.model';
import { MovimientosService } from '../movimientos/services/movimientos.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { } from '../../shared/components/navbar/navbar.component';
import { MovimientoDetalleModalComponent } from '../movimientos/components/movimiento-detalle-modal/movimiento-detalle-modal.component';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-movimientos-pendientes-page',
  templateUrl: './movimientos-pendientes.page.html',
  styleUrl: './movimientos-pendientes.page.css',
  imports: [CommonModule, FormsModule, MovimientoDetalleModalComponent],
  standalone: true,
})
export class MovimientosPendientesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly router = inject(Router);
  private readonly movimientosService = inject(MovimientosService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  readonly esPremium = computed(() => this.perfilService.perfil()?.plan === 'PREMIUM');
  readonly nombreNavbar = this.usuarioService.nombreNavbar;
  readonly alumnoId = signal<string>('');
  readonly nombreAlumno = signal<string>('');

  readonly rawMovimientos = signal<Movimiento[]>([]);
  readonly cargando = signal(true);
  readonly errorMsg = signal<string | null>(null);

  readonly filtroBusqueda = signal<string>('');
  readonly filtroFecha = signal<string>('');
  readonly mostrarFiltrosAvanzados = signal<boolean>(false);

  readonly filtroEstado = signal<string>('TODOS');
  readonly filtroFechaDesde = signal<string>('');
  readonly filtroFechaHasta = signal<string>('');
  readonly filtroPrecioMin = signal<number | null>(null);
  readonly filtroPrecioMax = signal<number | null>(null);

  readonly modalMovimiento = signal<Movimiento | null>(null);

  readonly movimientosFiltrados = computed<Movimiento[]>(() => {
    const list = this.rawMovimientos();
    const estado = this.filtroEstado();
    const desde = this.filtroFechaDesde();
    const hasta = this.filtroFechaHasta();
    const minPrice = this.filtroPrecioMin();
    const maxPrice = this.filtroPrecioMax();
    const query = this.filtroBusqueda().toLowerCase().trim();
    const selectedDate = this.filtroFecha();

    let filtered = list;

    if (query) {
      filtered = filtered.filter((m) => {
        return m.items.some((item) => item.productName.toLowerCase().includes(query));
      });
    }

    if (selectedDate) {
      filtered = filtered.filter((m) => {
        return m.date.startsWith(selectedDate);
      });
    }

    return filtered.filter((m) => {
      if (estado !== 'TODOS' && m.status !== estado) {
        return false;
      }

      if (desde) {
        const dateLimit = new Date(`${desde}T00:00:00`);
        if (new Date(m.date) < dateLimit) return false;
      }
      if (hasta) {
        const dateLimit = new Date(`${hasta}T23:59:59`);
        if (new Date(m.date) > dateLimit) return false;
      }

      if (minPrice !== null && minPrice !== undefined && m.totalAmount < minPrice) {
        return false;
      }
      if (maxPrice !== null && maxPrice !== undefined && m.totalAmount > maxPrice) {
        return false;
      }

      return true;
    });
  });

  readonly movimientosAgrupadosPorDia = computed<{ fechaStr: string; movimientos: Movimiento[] }[]>(() => {
    const list = this.movimientosFiltrados();
    const groupsMap = new Map<string, Movimiento[]>();
    const orderedKeys: string[] = [];

    for (const m of list) {
      const d = new Date(m.date);
      const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      const dia = d.getDate();
      const mes = meses[d.getMonth()];
      const anio = d.getFullYear();
      const dateStr = `${dia} ${mes} ${anio}`;

      if (!groupsMap.has(dateStr)) {
        groupsMap.set(dateStr, []);
        orderedKeys.push(dateStr);
      }
      groupsMap.get(dateStr)!.push(m);
    }

    return orderedKeys.map((key) => ({
      fechaStr: key,
      movimientos: groupsMap.get(key)!,
    }));
  });

  ngOnInit(): void {
    void this.alumnosService.asegurarCargados().then(() => {
      const id = this.contextoService.alumnoId();
      this.alumnoId.set(id);

      const alumno = this.alumnosService.getAlumnoById(id);
      if (alumno) {
        this.nombreAlumno.set(alumno.nombre.split(' ')[0]);
      } else {
        this.nombreAlumno.set('Alumno');
      }

      this.cargarHistorial();
    });
  }

  cargarHistorial(): void {
    const id = this.alumnoId();
    if (!id) return;

    this.cargando.set(true);
    this.errorMsg.set(null);

    this.movimientosService.getPendientesAlumno(id).subscribe({
      next: (data) => {
        this.rawMovimientos.set(
          [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar movimientos pendientes:', err);
        this.errorMsg.set('No se pudieron obtener los movimientos pendientes de la base de datos.');
        this.cargando.set(false);
      }
    });
  }

  limpiarFiltros(): void {
    this.filtroBusqueda.set('');
    this.filtroFecha.set('');
    this.filtroEstado.set('TODOS');
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.filtroPrecioMin.set(null);
    this.filtroPrecioMax.set(null);
  }

  get activeChips(): { id: string; label: string }[] {
    const chips = [];

    if (this.filtroEstado() !== 'TODOS') {
      const label = this.filtroEstado() === 'PENDIENTE' ? 'A Preparar' : 'Listo';
      chips.push({ id: 'estado', label: `Estado: ${label}` });
    }

    if (this.filtroPrecioMin() !== null || this.filtroPrecioMax() !== null) {
      const min = this.filtroPrecioMin() ?? 0;
      const max = this.filtroPrecioMax() ? `$${this.filtroPrecioMax()}` : 'Max';
      chips.push({ id: 'rango', label: `Rango: $${min} - ${max}` });
    }

    if (this.filtroFechaDesde() || this.filtroFechaHasta()) {
      const desde = this.filtroFechaDesde() ? this.filtroFechaDesde() : 'Inicio';
      const hasta = this.filtroFechaHasta() ? this.filtroFechaHasta() : 'Fin';
      chips.push({ id: 'fecha', label: `Fechas: ${desde} a ${hasta}` });
    }

    return chips;
  }

  removeChip(id: string): void {
    if (id === 'estado') {
      this.filtroEstado.set('TODOS');
    } else if (id === 'rango') {
      this.filtroPrecioMin.set(null);
      this.filtroPrecioMax.set(null);
    } else if (id === 'fecha') {
      this.filtroFechaDesde.set('');
      this.filtroFechaHasta.set('');
    }
  }

  mostrarHoraOMediodia(mov: Movimiento): string {
    if (mov.tipo === 'ANTICIPADA' && mov.pickupSlotDescription) {
      return mov.pickupSlotDescription;
    }
    const date = new Date(mov.date);
    const hora = String(date.getHours()).padStart(2, '0');
    const mins = String(date.getMinutes()).padStart(2, '0');
    return `${hora}:${mins} hs`;
  }

  abrirDetalle(movimiento: Movimiento): void {
    this.modalMovimiento.set(movimiento);
  }

  cerrarDetalle(): void {
    this.modalMovimiento.set(null);
  }

  getInicialesAlumno(studentId: string): string {
    const alumno = this.alumnosService.getAlumnoById(studentId);
    if (!alumno) return 'AL';
    return ((alumno.nombre[0] ?? '') + (alumno.apellido[0] ?? '')).toUpperCase();
  }

  getFotoPerfilAlumno(studentId: string): string | null {
    const alumno = this.alumnosService.getAlumnoById(studentId);
    return alumno?.urlFotoPerfil ?? null;
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(precio);
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const date = new Date(fechaStr);
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  mostrarFecha(mov: Movimiento): string {
    if (mov.tipo === 'ANTICIPADA' && mov.pickupDate) {
      const parts = mov.pickupDate.split('-');
      let dateStr = mov.pickupDate;
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        dateStr = new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(d);
      }
      const slot = mov.pickupSlotDescription ? ` - ${mov.pickupSlotDescription}` : '';
      return `${dateStr}${slot}`;
    }
    return this.formatearFecha(mov.date);
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }

  async cancelarPedido(id: string): Promise<void> {
    const confirmed = await this.dialogService.confirm('¿Estás seguro de que deseas cancelar este pedido? Se le reembolsará el saldo al alumno.', 'Cancelar Pedido');
    if (confirmed) {
      this.movimientosService.cancelarCompra(id).subscribe({
        next: () => {
          this.toastService.mostrar('Pedido cancelado y saldo reembolsado', 'success');
          
          this.rawMovimientos.update((list) =>
            list.filter((m) => m.id !== id)
          );
          this.cerrarDetalle();
        },
        error: (err) => {
          console.error('Error al cancelar el pedido:', err);
          this.toastService.mostrar('Error al cancelar el pedido', 'error');
        }
      });
    }
  }
}
