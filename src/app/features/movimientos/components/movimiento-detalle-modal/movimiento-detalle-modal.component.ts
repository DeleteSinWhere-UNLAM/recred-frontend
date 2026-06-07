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
}
