import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DirectivoService } from '../../services/directivo.service';
import { CrearBuffetRequest } from '../../models/directivo.model';

@Injectable()
export class CrearBuffetPresenter {
  private readonly directivoService = inject(DirectivoService);
  private readonly router = inject(Router);

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  public get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  public get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  public async crear(schoolId: string, buffetData: CrearBuffetRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.directivoService.crearBuffet(schoolId, buffetData);
      this.router.navigate(['/directivo']);
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse) {
        this._error.set('Ocurrió un error al registrar el buffet.');
      } else {
        this._error.set('Error inesperado.');
      }
    } finally {
      this._loading.set(false);
    }
  }

  public cancelar(): void {
    this.router.navigate(['/directivo']);
  }
}
