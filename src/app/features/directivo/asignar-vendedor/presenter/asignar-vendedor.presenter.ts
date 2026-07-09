import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DirectivoService } from '../../services/directivo.service';
import { CrearVendedorRequest } from '../../models/directivo.model';
import { ToastService } from '../../../../shared/services/toast.service';

@Injectable()
export class AsignarVendedorPresenter {
  private readonly directivoService = inject(DirectivoService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  public get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  public get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  public async asignar(buffetId: string, vendedorData: CrearVendedorRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.directivoService.registrarVendedor(buffetId, vendedorData);
      this.router.navigate(['/directivo']);
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 409 && err.error?.code === 'USERNAME_EXISTS') {
          this._error.set('El correo o nombre de usuario ya está registrado.');
        } else {
          this._error.set('Ocurrió un error al asignar el vendedor.');
        }
      } else {
        this._error.set('Error inesperado.');
      }
    } finally {
      this._loading.set(false);
    }
  }

  public async reemplazar(buffetId: string, vendedorData: CrearVendedorRequest): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.directivoService.reemplazarVendedor(buffetId, vendedorData);
      this.toastService.mostrar('Vendedor reemplazado exitosamente.', 'success');
      this.router.navigate(['/directivo']);
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 403) {
          this._error.set('No tienes permisos para realizar esta acción.');
        } else if (err.status === 400) {
          this._error.set('Los datos proporcionados son inválidos.');
        } else if (err.status === 409) {
          this._error.set('Conflicto: El correo o nombre de usuario ya está registrado.');
        } else {
          this._error.set('Ocurrió un error al reemplazar el vendedor.');
        }
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

