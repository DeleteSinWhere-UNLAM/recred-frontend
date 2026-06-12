import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionSugerenciaSaludableService } from './notificacion-sugerencia-saludable.service';
import { CarritoService } from '../../../../features/compra/services/carrito.service';
import { Router } from '@angular/router';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { ToastService } from '../../../services/toast.service';
import { AcreditarMercadoPagoService } from '../../../../features/acreditar-mercado-pago/services/acreditar-mercado-pago.service';
import { CompraService } from '../../../../features/compra/services/compra.service';

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
  private alumnosService = inject(AlumnosService);
  private toastService = inject(ToastService);
  private mercadoPagoService = inject(AcreditarMercadoPagoService);
  private compraService = inject(CompraService);
  private router = inject(Router);

  cerrar() {
    this.notificacionService.cerrar();
  }

  async comprarProducto() {
    const state = this.notificacionService.state$();
    const producto = state.producto;
    const alumnoId = state.alumnoId;

    if (!producto || !alumnoId) {
      this.cerrar();
      return;
    }

    try {
      await this.alumnosService.asegurarCargados();
      const alumno = this.alumnosService.getAlumnoById(alumnoId);

      if (!alumno) {
        this.toastService.mostrar('No pudimos encontrar la información del alumno.', 'error');
        this.cerrar();
        return;
      }

      if (alumno.saldo >= producto.precio) {
        this.carritoService.agregar(producto, alumnoId, 1);

        this.compraService.setSugerenciaPendiente(state.sugerenciaId);

        this.router.navigate(['/compra']);
        this.cerrar();
      } else {
        const linkPago = await this.mercadoPagoService.generarLinkPago(alumnoId, producto.precio);
        this.toastService.mostrar(
          `Saldo insuficiente para "${producto.nombre}". <a href="${linkPago}" target="_blank" style="color: white; text-decoration: underline; font-weight: bold;">Cargar saldo con Mercado Pago</a>`,
          'error',
          8000
        );
      }
    } catch (error) {
      console.error('Error al procesar la compra sugerida:', error);
      this.toastService.mostrar('Hubo un error al procesar tu solicitud. Reintentá en unos momentos.', 'error');
    }
  }
}
