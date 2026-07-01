import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PreferenciaDetectada } from '../models/preferencia-detectada.model';
import { PreferenciasDetectadasService } from '../services/preferencias-detectadas.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';

@Injectable()
export class PreferenciasDetectadasPresenter {
  private readonly preferenciasService = inject(PreferenciasDetectadasService);
  private readonly usuarioService = inject(UsuarioService);

  private readonly _preferencias = new BehaviorSubject<PreferenciaDetectada[]>([]);
  readonly preferencias$: Observable<PreferenciaDetectada[]> = this._preferencias.asObservable();

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

    this.preferenciasService.getPreferencias(usuarioId)
      .pipe(
        catchError(() => {
          this._error.next('Error al cargar las preferencias detectadas.');
          return of([]);
        }),
        finalize(() => this._isLoading.next(false))
      )
      .subscribe((data) => {
        this._preferencias.next(data);
      });
  }
}
