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
      this.toastService.mostrar('Vendedor asignado. Se enviaron las credenciales al correo registrado.', 'success');
      this.router.navigate(['/directivo']);
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 409 && err.error?.code === 'USERNAME_EXISTS') {
          const msg = 'Error: El correo electrónico ya está registrado o es inválido. Por favor, intenta de nuevo.';
          this._error.set(msg);
          this.toastService.mostrar(msg, 'error');
        } else {
          this._error.set('Ocurrió un error al asignar el vendedor.');
          this.toastService.mostrar('Ocurrió un error al asignar el vendedor.', 'error');
        }
      } else {
        this._error.set('Error inesperado.');
        this.toastService.mostrar('Error inesperado.', 'error');
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
      this.toastService.mostrar('Vendedor reemplazado. Se enviaron las nuevas credenciales al correo registrado.', 'success');
      this.router.navigate(['/directivo']);
    } catch (err: unknown) {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 403) {
          const msg = 'No tienes permisos para realizar esta acción.';
          this._error.set(msg);
          this.toastService.mostrar(msg, 'error');
        } else if (err.status === 400) {
          const msg = 'Los datos proporcionados son inválidos. Verifica el correo electrónico.';
          this._error.set(msg);
          this.toastService.mostrar(msg, 'error');
        } else if (err.status === 409) {
          const msg = 'Error: El correo electrónico ya está registrado o es inválido. Por favor, intenta de nuevo.';
          this._error.set(msg);
          this.toastService.mostrar(msg, 'error');
        } else {
          const msg = 'Ocurrió un error al reemplazar el vendedor.';
          this._error.set(msg);
          this.toastService.mostrar(msg, 'error');
        }
      } else {
        const msg = 'Error inesperado.';
        this._error.set(msg);
        this.toastService.mostrar(msg, 'error');
      }
    } finally {
      this._loading.set(false);
    }
  }

  public cancelar(): void {
    this.router.navigate(['/directivo']);
  }
}

