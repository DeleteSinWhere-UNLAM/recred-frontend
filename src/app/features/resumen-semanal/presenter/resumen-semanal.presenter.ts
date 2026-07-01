import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { HijoResumen, MensajeHijo, ResumenSemanal } from '../models/resumen-semanal.model';
import { ResumenSemanalService } from '../services/resumen-semanal.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';

export interface HijoData {
  nombre: string;
  datos: HijoResumen;
}

export interface HijoResumenGrafico {
  nombre: string;
  gasto: number;
  porcentaje: number;
}

@Injectable()
export class ResumenSemanalPresenter {
  private readonly resumenService = inject(ResumenSemanalService);
  private readonly usuarioService = inject(UsuarioService);

  private readonly _resumen = new BehaviorSubject<ResumenSemanal | null>(null);
  readonly resumen$: Observable<ResumenSemanal | null> = this._resumen.asObservable();

  private readonly _hijos = new BehaviorSubject<HijoData[]>([]);
  readonly hijos$: Observable<HijoData[]> = this._hijos.asObservable();

  private readonly _hijosResumen = new BehaviorSubject<HijoResumenGrafico[]>([]);
  readonly hijosResumen$: Observable<HijoResumenGrafico[]> = this._hijosResumen.asObservable();

  private readonly _mensajes = new BehaviorSubject<MensajeHijo[]>([]);
  readonly mensajes$: Observable<MensajeHijo[]> = this._mensajes.asObservable();

  private readonly _totalFamiliar = new BehaviorSubject<number>(0);
  readonly totalFamiliar$: Observable<number> = this._totalFamiliar.asObservable();

  private readonly _isLoading = new BehaviorSubject<boolean>(false);
  readonly isLoading$: Observable<boolean> = this._isLoading.asObservable();

  private readonly _error = new BehaviorSubject<string | null>(null);
  readonly error$: Observable<string | null> = this._error.asObservable();

  initialize(): void {
    const usuarioId = this.usuarioService.getUsuarioActual()?.id;

    if (!usuarioId) {
      this._error.next('Usuario no autenticado.');
      return;
    }

    this._isLoading.next(true);
    this._error.next(null);

    this.resumenService.getResumen()
      .pipe(
        catchError(() => {
          this._error.next('Error al cargar el resumen semanal.');
          return of(null);
        }),
        finalize(() => this._isLoading.next(false))
      )
      .subscribe((data) => {
        if (!data) return;

        try {
          this._resumen.next(data);

          const resumenInterno = JSON.parse(data.resumen);

          const mensajesRaw: MensajeHijo[] = JSON.parse(resumenInterno.mensaje ?? '[]');
          const mensajesProcesados = mensajesRaw.map(m => ({
            ...m,
            nombre: m.nombre ? m.nombre.split(' ')[0] : ''
          }));

          const hijosData: HijoData[] = Object.entries(resumenInterno.hijos || {}).map(
            ([nombre, datos]) => ({
              nombre: nombre.split(' ')[0],
              datos: datos as HijoResumen,
            })
          );

          const total = hijosData.reduce((acc, hijo) => acc + (hijo.datos.totalGastado ?? 0), 0);

          const hijosGrafico: HijoResumenGrafico[] = hijosData.map(hijo => ({
            nombre: hijo.nombre,
            gasto: hijo.datos.totalGastado ?? 0,
            porcentaje: total > 0 ? ((hijo.datos.totalGastado ?? 0) / total) * 100 : 0
          })).sort((a, b) => b.gasto - a.gasto);

          this._mensajes.next(mensajesProcesados);
          this._hijos.next(hijosData);
          this._totalFamiliar.next(total);
          this._hijosResumen.next(hijosGrafico);
        } catch {
          this._error.next('Error al procesar los datos del resumen.');
        }
      });
  }

  getCategorias(hijo: HijoResumen): [string, number][] {
    return Object.entries(hijo.porCategoria ?? {});
  }
}
