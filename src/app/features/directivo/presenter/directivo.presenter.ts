import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { SchoolOverview } from '../models/directivo.model';
import { DirectivoService } from '../services/directivo.service';

@Injectable()
export class DirectivoPresenter {
  private readonly perfilService = inject(PerfilService);
  private readonly directivoService = inject(DirectivoService);
  
  private readonly _mensajeBienvenida = signal<string>('Cargando...');
  private readonly _schoolOverview = signal<SchoolOverview | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  
  public get mensajeBienvenida(): Signal<string> {
    return this._mensajeBienvenida.asReadonly();
  }

  public get schoolOverview(): Signal<SchoolOverview | null> {
    return this._schoolOverview.asReadonly();
  }

  public get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  public get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  public async inicializar(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const perfil = await this.perfilService.cargarPerfil();
      this._mensajeBienvenida.set(`Hola bienvenido, ${perfil.nombre}`);
    } catch {
      this._mensajeBienvenida.set('Hola bienvenido');
    }

    try {
      const overview = await this.directivoService.obtenerResumenColegio();
      this._schoolOverview.set(overview);
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 403) {
          this._error.set('No tienes permisos para ver este panel.');
        } else if (err.status === 404) {
          this._error.set('Colegio no encontrado para tu usuario.');
        } else {
          this._error.set('Ocurrió un error al cargar los datos.');
        }
      } else {
        this._error.set('Ocurrió un error inesperado al cargar los datos.');
      }
    } finally {
      this._loading.set(false);
    }
  }
}
