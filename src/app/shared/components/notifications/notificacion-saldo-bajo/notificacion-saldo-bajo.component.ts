import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionSaldoBajoService } from './notificacion-saldo-bajo.service';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../../../core/services/alumno-contexto.service';

@Component({
  selector: 'app-notificacion-saldo-bajo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificacion-saldo-bajo.component.html',
  styleUrl: './notificacion-saldo-bajo.component.css'
})
export class NotificacionSaldoBajoComponent {
  protected notificacionService = inject(NotificacionSaldoBajoService);
  private contextoService = inject(AlumnoContextoService);
  private router = inject(Router);

  cerrar() {
    this.notificacionService.cerrar();
  }

  comprarSaldo() {
    this.cerrar();
    const alumnoId = this.notificacionService.state$().alumnoId;
    console.log(alumnoId);
    if (!alumnoId) {
      console.error('No se pudo obtener el ID del alumno');
      return;
    }
    this.contextoService.setAlumnoId(alumnoId);
    this.router.navigateByUrl('/acreditar-mercado-pago');
  }
}
