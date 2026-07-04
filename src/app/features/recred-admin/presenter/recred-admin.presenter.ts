import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SchoolRegistration } from '../models/solicitud-colegio.model';
import { RecredAdminService } from '../services/recred-admin.service';
import { ToastService } from '../../../shared/services/toast.service';

@Injectable()
export class RecredAdminPresenter {
  private readonly _solicitudes = new BehaviorSubject<SchoolRegistration[]>([]);
  readonly solicitudes$ = this._solicitudes.asObservable();

  private readonly _cargando = new BehaviorSubject<boolean>(false);
  readonly cargando$ = this._cargando.asObservable();

  private readonly _error = new BehaviorSubject<string | null>(null);
  readonly error$ = this._error.asObservable();

  private readonly adminService = inject(RecredAdminService);
  private readonly toastService = inject(ToastService);

  initialize(): void {
    this._cargando.next(true);
    this._error.next(null);

    this.adminService.getPendingRegistrations().subscribe({
      next: (solicitudes) => {
        this._solicitudes.next(solicitudes);
        this._cargando.next(false);
      },
      error: () => {
        this._error.next('Error al cargar las solicitudes pendientes.');
        this._cargando.next(false);
      },
    });
  }

  aprobar(id: string): void {
    this.adminService.approveRegistration(id).subscribe({
      next: () => {
        this.removerSolicitud(id);
        this.toastService.mostrar('Colegio aprobado. El director recibirá un email con sus credenciales.', 'success');
      },
      error: (err) => {
        console.error('Error al aprobar la solicitud:', err);
        this.toastService.mostrar('Error al aprobar la solicitud.', 'error');
      },
    });
  }

  rechazar(id: string): void {
    this.adminService.rejectRegistration(id).subscribe({
      next: () => {
        this.removerSolicitud(id);
        this.toastService.mostrar('Solicitud rechazada.', 'success');
      },
      error: (err) => {
        console.error('Error al rechazar la solicitud:', err);
        this.toastService.mostrar('Error al rechazar la solicitud.', 'error');
      },
    });
  }

  private removerSolicitud(id: string): void {
    const actualizadas = this._solicitudes.getValue().filter(s => s.id !== id);
    this._solicitudes.next(actualizadas);
  }
}
