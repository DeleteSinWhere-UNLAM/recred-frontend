import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Movimiento } from '../../movimientos/models/movimiento.model';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { FranjasHorariasService } from '../../restricciones-horarias/services/franjas-horarias.service';
import { EstadoPedido, PedidoEnCurso } from '../models/pedido-en-curso.model';
import { Recreo } from '../models/recreo.model';

const formateadorTotal = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

const ESTADO_PEDIDO_POR_BACK: Record<string, EstadoPedido> = {
  PENDIENTE: 'CONFIRMADO',
  PENDING: 'CONFIRMADO',
  EN_PREPARACION: 'PREPARANDO',
  PREPARANDO: 'PREPARANDO',
  LISTO: 'LISTO',
  ENTREGADO: 'ENTREGADO',
};

@Injectable({ providedIn: 'root' })
export class HomeAlumnoService {
  private readonly movimientosService = inject(MovimientosService);
  private readonly franjasHorariasService = inject(FranjasHorariasService);

  private readonly pedidosState = signal<Record<string, PedidoEnCurso | null>>({});
  private readonly recreosState = signal<Record<string, readonly Recreo[]>>({});

  getPedidoEnCurso(alumnoId: string): PedidoEnCurso | undefined {
    return this.pedidosState()[alumnoId] ?? undefined;
  }

  getProximoRecreo(
    colegioId: string | undefined,
    ahora: Date = new Date(),
  ): Recreo | undefined {
    if (!colegioId) return undefined;
    const recreos = this.recreosState()[colegioId];
    if (!recreos || recreos.length === 0) return undefined;
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    return recreos.find((r) => this.aMinutos(r.horaFin) > minutosAhora);
  }

  async cargarRecreos(colegioId: string): Promise<void> {
    if (!colegioId) return;
    try {
      const franjas = await this.franjasHorariasService.getFranjasHorarias(colegioId);
      const recreos = franjas
        .filter((f) => f.activo && /recreo/i.test(f.descripcion))
        .map((f): Recreo => ({
          nombre: f.descripcion,
          horaInicio: f.horaInicio.slice(0, 5),
          horaFin: f.horaFin.slice(0, 5),
        }))
        .sort((a, b) => this.aMinutos(a.horaInicio) - this.aMinutos(b.horaInicio));
      this.recreosState.update((mapa) => ({ ...mapa, [colegioId]: recreos }));
    } catch (err) {
      console.error('Error cargando recreos del colegio:', err);
      this.recreosState.update((mapa) => ({ ...mapa, [colegioId]: [] }));
    }
  }

  private aMinutos(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  async cargarPedidoEnCurso(alumnoId: string): Promise<void> {
    if (!alumnoId) return;
    try {
      const pendientes = await firstValueFrom(
        this.movimientosService.getPendientesAlumno(alumnoId),
      );
      const pedido = this.elegirPedidoDeHoy(pendientes);
      this.pedidosState.update((mapa) => ({ ...mapa, [alumnoId]: pedido }));
    } catch (err) {
      console.error('Error cargando pedido en curso del alumno:', err);
      this.pedidosState.update((mapa) => ({ ...mapa, [alumnoId]: null }));
    }
  }

  private elegirPedidoDeHoy(movimientos: readonly Movimiento[]): PedidoEnCurso | null {
    const hoy = new Date().toISOString().slice(0, 10);
    const candidatos = movimientos.filter((m) => this.esDeHoy(m, hoy));
    if (candidatos.length === 0) return null;

    const ordenados = [...candidatos].sort(
      (a, b) => this.momentoRetiro(a) - this.momentoRetiro(b),
    );
    return this.mapearAPedido(ordenados[0]);
  }

  private esDeHoy(mov: Movimiento, hoy: string): boolean {
    if (mov.pickupDate) return mov.pickupDate.startsWith(hoy);
    return (mov.date ?? '').startsWith(hoy);
  }

  private momentoRetiro(mov: Movimiento): number {
    const base = mov.pickupDate ?? mov.date ?? '';
    const time = mov.pickupSlotStartTime ?? '00:00';
    const iso = base.length === 10 ? `${base}T${time}` : base;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
  }

  private mapearAPedido(mov: Movimiento): PedidoEnCurso {
    const estado = ESTADO_PEDIDO_POR_BACK[(mov.status ?? '').toUpperCase()] ?? 'CONFIRMADO';
    return {
      id: mov.id,
      estado,
      itemsResumen: mov.items.map((it) =>
        it.quantity > 1 ? `${it.quantity}x ${it.productName}` : it.productName,
      ),
      totalFormateado: formateadorTotal.format(mov.totalAmount ?? 0),
      retiraEn: this.horaRetiro(mov),
    };
  }

  private horaRetiro(mov: Movimiento): string {
    if (mov.pickupSlotStartTime) return mov.pickupSlotStartTime;
    if (mov.pickupSlotDescription) return mov.pickupSlotDescription;
    if (!mov.date) return '';
    const d = new Date(mov.date);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
