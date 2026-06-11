import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionSugerenciaSaludableService } from './notificacion-sugerencia-saludable.service';
import { CarritoService } from '../../../../features/compra/services/carrito.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notificacion-sugerencia-saludable',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificacion-sugerencia-saludable.component.html',
  styleUrl: './notificacion-sugerencia-saludable.component.css'
})
export class NotificacionSugerenciaSaludableComponent {
  protected notificacionService = inject(NotificacionSugerenciaSaludableService);
  private carritoService = inject(CarritoService);
  private router = inject(Router);

  cerrar() {
    this.notificacionService.cerrar();
  }

  comprarProducto() {
    const state = this.notificacionService.state$();
    const producto = state.producto;
    const alumnoId = state.alumnoId;

    if (producto && alumnoId) {
      this.carritoService.agregar(producto, alumnoId, 1);
      this.router.navigate(['/compra']);
    }

    this.cerrar();
  }
}
