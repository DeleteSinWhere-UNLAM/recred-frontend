import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Movimiento } from '../../models/movimiento.model';

@Component({
  selector: 'app-movimiento-detalle-modal',
  templateUrl: './movimiento-detalle-modal.component.html',
  styleUrl: './movimiento-detalle-modal.component.css',
  imports: [],
})
export class MovimientoDetalleModalComponent {
  @Input({ required: true }) movimiento!: Movimiento;
  @Input() nombreAlumno = '';
  @Input() esVistaAlumno = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<string>();

  onCerrar(): void {
    this.cerrar.emit();
  }

  puedoCancelar(): boolean {
    return !this.esVistaAlumno &&
           this.movimiento.tipo === 'ANTICIPADA' &&
           (this.movimiento.status === 'PENDIENTE' || this.movimiento.status === 'EN_PREPARACION');
  }

  esFechaLimiteSuperada(): boolean {
    if (!this.movimiento.pickupDate || !this.movimiento.pickupSlotStartTime) {
      return false;
    }
    const targetStr = `${this.movimiento.pickupDate}T${this.movimiento.pickupSlotStartTime}:00-03:00`;
    const targetTime = new Date(targetStr).getTime();
    const now = new Date().getTime();
    const diffMs = targetTime - now;
    const oneHourMs = 60 * 60 * 1000;
    return diffMs <= oneHourMs;
  }

  onCancelar(): void {
    this.cancelar.emit(this.movimiento.id);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCerrar();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCerrar();
    }
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
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  formatearFechaProgramada(fechaStr?: string): string {
    if (!fechaStr) return '';
    const parts = fechaStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    return fechaStr;
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
}
