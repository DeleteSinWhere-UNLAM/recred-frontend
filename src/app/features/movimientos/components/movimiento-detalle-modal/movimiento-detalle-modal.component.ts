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

  onCerrar(): void {
    this.cerrar.emit();
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
}
