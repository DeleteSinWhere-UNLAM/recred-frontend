import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReporteImportacionCsv } from '../../models/invitacion-tutor.model';
import { InvitacionesTutorService } from '../../services/invitaciones-tutor.service';

@Injectable()
export class ImportarTutoresPresenter {
  private readonly service = inject(InvitacionesTutorService);
  private readonly router = inject(Router);

  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _reporte = signal<ReporteImportacionCsv | null>(null);

  public get loading(): Signal<boolean> {
    return this._loading.asReadonly();
  }

  public get error(): Signal<string | null> {
    return this._error.asReadonly();
  }

  public get reporte(): Signal<ReporteImportacionCsv | null> {
    return this._reporte.asReadonly();
  }

  public async importar(archivo: File): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._reporte.set(null);

    try {
      const reporte = await this.service.importarCsv(archivo);
      this._reporte.set(reporte);
    } catch (err: unknown) {
      this._error.set(this.mapearError(err));
    } finally {
      this._loading.set(false);
    }
  }

  public volver(): void {
    this.router.navigate(['/directivo']);
  }

  public limpiar(): void {
    this._reporte.set(null);
    this._error.set(null);
  }

  private mapearError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const backendMsg =
        err.error && typeof err.error === 'object' && 'message' in err.error
          ? String((err.error as { message?: unknown }).message ?? '')
          : '';
      if (backendMsg) return backendMsg;
      if (err.status === 400) return 'El archivo CSV es inválido.';
      if (err.status === 403) return 'No tenés permisos para importar tutores.';
      if (err.status >= 500) return 'Error del servidor. Intentá más tarde.';
    }
    return 'No se pudo importar el archivo. Intentá nuevamente.';
  }
}
