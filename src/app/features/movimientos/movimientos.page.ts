import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Movimiento } from './models/movimiento.model';
import { MovimientosService } from './services/movimientos.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { MovimientoDetalleModalComponent } from './components/movimiento-detalle-modal/movimiento-detalle-modal.component';
import { PerfilService } from '../../data-access/services/perfil.service';
import { ToastService } from '../../shared/services/toast.service';
import { DialogService } from '../../shared/services/dialog.service';

@Component({
  selector: 'app-movimientos-page',
  templateUrl: './movimientos.page.html',
  styleUrl: './movimientos.page.css',
  imports: [CommonModule, FormsModule, NavbarComponent, MovimientoDetalleModalComponent],
})
export class MovimientosPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movimientosService = inject(MovimientosService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly toastService = inject(ToastService);
  private readonly dialogService = inject(DialogService);

  readonly esPremium = computed(() => this.perfilService.perfil()?.plan === 'PREMIUM');
  readonly esVistaAlumno = this.usuarioService.esVistaAlumno;
  readonly esVistaIndividual = signal<boolean>(false);
  readonly nombreAlumno = signal<string>('');

  readonly nombreNavbar = this.usuarioService.nombreNavbar;
  readonly alumnos = this.alumnosService.alumnos;

  readonly rawMovimientos = signal<Movimiento[]>([]);
  readonly cargando = signal(true);
  readonly errorMsg = signal<string | null>(null);

  readonly criterioAgrupacion = signal<'FECHA_COMPRA' | 'FECHA_RETIRO' | 'ALUMNO'>('FECHA_COMPRA');
  readonly collapsedGroups = signal<Set<string>>(new Set<string>());

  readonly filtroBusqueda = signal<string>('');
  readonly filtroFecha = signal<string>('');
  readonly mostrarFiltrosAvanzados = signal<boolean>(false);

  readonly selectedAlumnoId = signal<string>('todos');
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
      if (estado !== 'TODOS') {
        const allowedStates = estado.split(',');
        if (!allowedStates.includes(m.status)) {
          return false;
        }
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

  readonly movimientosAgrupados = computed<{ titulo: string; movimientos: Movimiento[] }[]>(() => {
    const list = this.movimientosFiltrados();
    const groupsMap = new Map<string, Movimiento[]>();
    const orderedKeys: string[] = [];
    const criterio = this.criterioAgrupacion();

    if (criterio === 'ALUMNO') {
      for (const m of list) {
        const nombre = this.getNombreAlumno(m.studentId);
        if (!groupsMap.has(nombre)) {
          groupsMap.set(nombre, []);
          orderedKeys.push(nombre);
        }
        groupsMap.get(nombre)!.push(m);
      }
      orderedKeys.sort((a, b) => a.localeCompare(b));
    } else if (criterio === 'FECHA_RETIRO') {
      const fallbackKey = 'Consumos Presenciales / Sin Retiro Programado';
      for (const m of list) {
        let key = fallbackKey;
        if (m.tipo === 'ANTICIPADA' && m.pickupDate) {
          const parts = m.pickupDate.split('-');
          if (parts.length === 3) {
            const year = parts[0];
            const month = parts[1];
            const day = parts[2];
            key = `${day}-${month}-${year}`;
          } else {
            key = m.pickupDate;
          }
        }
        if (!groupsMap.has(key)) {
          groupsMap.set(key, []);
          orderedKeys.push(key);
        }
        groupsMap.get(key)!.push(m);
      }

      orderedKeys.sort((a, b) => {
        if (a === fallbackKey) return 1;
        if (b === fallbackKey) return -1;
        
        const parseKey = (k: string) => {
          const parts = k.split('-');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day).getTime();
          }
          return new Date(k).getTime();
        };

        return parseKey(b) - parseKey(a);
      });
    } else {
      // Default: FECHA_COMPRA
      for (const m of list) {
        const d = new Date(m.date);
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        const dateStr = `${dia}-${mes}-${anio}`;

        if (!groupsMap.has(dateStr)) {
          groupsMap.set(dateStr, []);
          orderedKeys.push(dateStr);
        }
        groupsMap.get(dateStr)!.push(m);
      }
    }

    return orderedKeys.map((key) => ({
      titulo: key,
      movimientos: groupsMap.get(key)!,
    }));
  });

  toggleGroup(titulo: string): void {
    this.collapsedGroups.update((set) => {
      const next = new Set(set);
      if (next.has(titulo)) {
        next.delete(titulo);
      } else {
        next.add(titulo);
      }
      return next;
    });
  }

  isGroupExpanded(titulo: string): boolean {
    return !this.collapsedGroups().has(titulo);
  }

  ngOnInit(): void {
    void this.alumnosService.asegurarCargados().then(() => {
      this.route.queryParams?.subscribe((queryParams) => {
        if (queryParams['estado']) {
          this.filtroEstado.set(queryParams['estado']);
        } else {
          this.filtroEstado.set('TODOS');
        }
      });

      this.route.paramMap.subscribe((params) => {
        const alumnoId = params.get('alumnoId');
        if (this.esVistaAlumno()) {
          const currentAlumnoId = this.perfilService.obtenerAlumnoId() ?? this.usuarioService.getAlumnoActual().id;
          this.selectedAlumnoId.set(currentAlumnoId);
          this.esVistaIndividual.set(true);
          const alumno = this.alumnosService.getAlumnoById(currentAlumnoId);
          if (alumno) {
            this.nombreAlumno.set(`${alumno.nombre} ${alumno.apellido}`);
          }
        } else if (alumnoId) {
          this.selectedAlumnoId.set(alumnoId);
          this.esVistaIndividual.set(true);
          const alumno = this.alumnosService.getAlumnoById(alumnoId);
          if (alumno) {
            this.nombreAlumno.set(`${alumno.nombre} ${alumno.apellido}`);
          }
        } else {
          this.selectedAlumnoId.set('todos');
          this.esVistaIndividual.set(false);
          this.nombreAlumno.set('');
        }
        this.cargarHistorial();
      });
    });
  }

  cargarHistorial(): void {
    this.cargando.set(true);
    this.errorMsg.set(null);
    const id = this.selectedAlumnoId();

    const request$ = id === 'todos'
      ? this.movimientosService.getHistorialTutor()
      : this.movimientosService.getHistorialAlumno(id);

    request$.subscribe({
      next: (data) => {
        this.rawMovimientos.set(
          [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        );
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar movimientos:', err);
        this.errorMsg.set('No se pudieron obtener los movimientos de la base de datos.');
        this.cargando.set(false);
      }
    });
  }

  onAlumnoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const val = target.value;
    if (val === 'todos') {
      this.router.navigate(['/movimientos']);
    } else {
      this.router.navigate(['/movimientos', val]);
    }
  }

  limpiarFiltros(): void {
    this.filtroBusqueda.set('');
    this.filtroFecha.set('');
    this.filtroEstado.set('TODOS');
    this.filtroFechaDesde.set('');
    this.filtroFechaHasta.set('');
    this.filtroPrecioMin.set(null);
    this.filtroPrecioMax.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { estado: null },
      queryParamsHandling: 'merge',
    });
    if (!this.esVistaAlumno() && this.selectedAlumnoId() !== 'todos') {
      this.selectedAlumnoId.set('todos');
      void this.router.navigate(['/movimientos']);
    }
  }

  get activeChips(): { id: string; label: string }[] {
    const chips = [];

    if (!this.esVistaAlumno() && this.selectedAlumnoId() !== 'todos') {
      const alumno = this.alumnosService.getAlumnoById(this.selectedAlumnoId());
      if (alumno) {
        chips.push({ id: 'alumno', label: `Hijo: ${alumno.nombre} ${alumno.apellido}` });
      }
    }

    if (this.filtroEstado() !== 'TODOS') {
      const map: Record<string, string> = {
        PENDIENTE: 'A Preparar',
        EN_PREPARACION: 'En preparación',
        LISTO: 'Listo para retirar',
        ENTREGADO: 'Entregado',
        CANCELADO: 'Cancelado',
        NO_RETIRADO: 'No entregado',
      };
      const label = this.filtroEstado()
        .split(',')
        .map((s) => map[s] || s)
        .join(', ');
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
    if (id === 'alumno') {
      this.selectedAlumnoId.set('todos');
      void this.router.navigate(['/movimientos']);
    } else if (id === 'estado') {
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

  getNombreAlumno(studentId: string): string {
    const alumno = this.alumnosService.getAlumnoById(studentId);
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : 'Alumno';
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
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(precio);
  }

  formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const date = new Date(fechaStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  mostrarFecha(mov: Movimiento): string {
    if (mov.tipo === 'ANTICIPADA' && mov.pickupDate) {
      const parts = mov.pickupDate.split('-');
      let dateStr = mov.pickupDate;
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        dateStr = `${day}-${month}-${year}`;
      }
      const slot = mov.pickupSlotDescription ? ` - ${mov.pickupSlotDescription}` : '';
      return `${dateStr}${slot}`;
    }
    return this.formatearFecha(mov.date);
  }

  volver(): void {
    if (this.esVistaAlumno()) {
      this.router.navigateByUrl('/alumno');
    } else {
      this.router.navigateByUrl('/tutor');
    }
  }

  async cancelarPedido(id: string): Promise<void> {
    const confirmed = await this.dialogService.confirm('¿Estás seguro de que deseas cancelar este pedido? Se le reembolsará el saldo al alumno.', 'Cancelar Pedido');
    if (confirmed) {
      this.movimientosService.cancelarCompra(id).subscribe({
        next: () => {
          this.toastService.mostrar('Pedido cancelado y saldo reembolsado', 'success');
          
          this.rawMovimientos.update((list) =>
            list.map((m) =>
              m.id === id
                ? { ...m, status: 'CANCELADO', statusLabel: 'Cancelado' }
                : m
            )
          );
          
          const openModal = this.modalMovimiento();
          if (openModal && openModal.id === id) {
            this.modalMovimiento.set({
              ...openModal,
              status: 'CANCELADO',
              statusLabel: 'Cancelado'
            });
          }
        },
        error: (err) => {
          console.error('Error al cancelar el pedido:', err);
          this.toastService.mostrar('Error al cancelar el pedido', 'error');
        }
      });
    }
  }
}
