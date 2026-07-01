import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NotificacionPrecio } from '../models/notificacion-precio.model';
import { NotificacionesPrecioService } from '../services/notificaciones-precio.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';

@Injectable()
export class NotificacionesPrecioPresenter {
  private readonly notificacionesService = inject(NotificacionesPrecioService);
  private readonly usuarioService = inject(UsuarioService);

  private readonly _notificaciones = new BehaviorSubject<NotificacionPrecio[]>([]);
  readonly notificaciones$: Observable<NotificacionPrecio[]> = this._notificaciones.asObservable();

  private readonly _isLoading = new BehaviorSubject<boolean>(false);
  readonly isLoading$: Observable<boolean> = this._isLoading.asObservable();

  private readonly _error = new BehaviorSubject<string | null>(null);
  readonly error$: Observable<string | null> = this._error.asObservable();

  initialize(): void {
    const usuarioActual = this.usuarioService.getUsuarioActual();
    const usuarioId = usuarioActual?.id;

    if (!usuarioId) {
      this._error.next('Usuario no autenticado.');
      return;
    }

    this._isLoading.next(true);
    this._error.next(null);

    this.notificacionesService.getNotificaciones(usuarioId)
      .pipe(
        catchError(() => {
          this._error.next('Error al cargar las notificaciones.');
          return of([]);
        }),
        finalize(() => this._isLoading.next(false))
      )
      .subscribe((data) => {
        this._notificaciones.next(data);
      });
  }
}
