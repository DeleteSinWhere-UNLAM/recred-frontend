import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../../../shared/services/toast.service';
import { SchoolOverview } from '../models/directivo.model';
import {
  FranjaHorariaColegio,
  FranjaHorariaPayload,
  GradoColegio,
  GradoPayload,
  NivelColegio,
} from '../models/gestion-escolar.model';
import { DirectivoService } from '../services/directivo.service';
import { GestionEscolarService } from '../services/gestion-escolar.service';

@Injectable()
export class GestionEscolarPresenter {
  private readonly directivoService = inject(DirectivoService);
  private readonly gestionEscolarService = inject(GestionEscolarService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly _schoolOverview = signal<SchoolOverview | null>(null);
  private readonly _niveles = signal<NivelColegio[]>([]);
  private readonly _grados = signal<GradoColegio[]>([]);
  private readonly _franjas = signal<FranjaHorariaColegio[]>([]);
  private readonly _loadingInicial = signal<boolean>(true);
  private readonly _loadingGrados = signal<boolean>(false);
  private readonly _loadingFranjas = signal<boolean>(false);
  private readonly _accionEnCurso = signal<string | null>(null);
  private readonly _errorInicial = signal<string | null>(null);
  private readonly _errorGrados = signal<string | null>(null);
  private readonly _errorFranjas = signal<string | null>(null);
  private readonly _errorOperacion = signal<string | null>(null);

  public get schoolOverview(): Signal<SchoolOverview | null> {
    return this._schoolOverview.asReadonly();
  }

  public get niveles(): Signal<NivelColegio[]> {
    return this._niveles.asReadonly();
  }

  public get grados(): Signal<GradoColegio[]> {
    return this._grados.asReadonly();
  }

  public get franjas(): Signal<FranjaHorariaColegio[]> {
    return this._franjas.asReadonly();
  }

  public get loadingInicial(): Signal<boolean> {
    return this._loadingInicial.asReadonly();
  }

  public get loadingGrados(): Signal<boolean> {
    return this._loadingGrados.asReadonly();
  }

  public get loadingFranjas(): Signal<boolean> {
    return this._loadingFranjas.asReadonly();
  }

  public get accionEnCurso(): Signal<string | null> {
    return this._accionEnCurso.asReadonly();
  }

  public get errorInicial(): Signal<string | null> {
    return this._errorInicial.asReadonly();
  }

  public get errorGrados(): Signal<string | null> {
    return this._errorGrados.asReadonly();
  }

  public get errorFranjas(): Signal<string | null> {
    return this._errorFranjas.asReadonly();
  }

  public get errorOperacion(): Signal<string | null> {
    return this._errorOperacion.asReadonly();
  }

  public async inicializar(): Promise<void> {
    this._loadingInicial.set(true);
    this._errorInicial.set(null);
    this._errorOperacion.set(null);

    try {
      const overview = await this.directivoService.obtenerResumenColegio();
      this._schoolOverview.set(overview);
      await this.cargarNiveles();
      await Promise.all([this.cargarGrados(), this.cargarFranjas()]);
    } catch (err: unknown) {
      this._errorInicial.set(this.mapearError(err, 'No pudimos cargar la gestion escolar.'));
    } finally {
      this._loadingInicial.set(false);
    }
  }

  public async recargarGrados(): Promise<void> {
    await this.cargarGrados();
  }

  public async recargarFranjas(): Promise<void> {
    await this.cargarFranjas();
  }

  public async guardarGrado(payload: GradoPayload, gradeId?: string): Promise<boolean> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId || this._accionEnCurso()) return false;

    this._accionEnCurso.set(gradeId ? `grado-${gradeId}-guardar` : 'grado-crear');
    this._errorOperacion.set(null);

    try {
      if (gradeId) {
        await this.gestionEscolarService.editarGrado(schoolId, gradeId, payload);
        this.toastService.mostrar('Grado actualizado.', 'success');
      } else {
        await this.gestionEscolarService.crearGrado(schoolId, payload);
        this.toastService.mostrar('Grado creado.', 'success');
      }
      await this.cargarGrados();
      return true;
    } catch (err: unknown) {
      this.mostrarErrorOperacion(err, 'No pudimos guardar el grado.');
      return false;
    } finally {
      this._accionEnCurso.set(null);
    }
  }

  public async eliminarGrado(gradeId: string): Promise<boolean> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId || this._accionEnCurso()) return false;

    this._accionEnCurso.set(`grado-${gradeId}-eliminar`);
    this._errorOperacion.set(null);

    try {
      await this.gestionEscolarService.eliminarGrado(schoolId, gradeId);
      this.toastService.mostrar('Grado dado de baja.', 'success');
      await this.cargarGrados();
      return true;
    } catch (err: unknown) {
      this.mostrarErrorOperacion(err, 'No pudimos dar de baja el grado.');
      return false;
    } finally {
      this._accionEnCurso.set(null);
    }
  }

  public async reactivarGrado(gradeId: string): Promise<boolean> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId || this._accionEnCurso()) return false;

    this._accionEnCurso.set(`grado-${gradeId}-reactivar`);
    this._errorOperacion.set(null);

    try {
      await this.gestionEscolarService.reactivarGrado(schoolId, gradeId);
      this.toastService.mostrar('Grado reactivado.', 'success');
      await this.cargarGrados();
      return true;
    } catch (err: unknown) {
      this.mostrarErrorOperacion(err, 'No pudimos reactivar el grado.');
      return false;
    } finally {
      this._accionEnCurso.set(null);
    }
  }

  public async guardarFranja(payload: FranjaHorariaPayload, slotId?: string): Promise<boolean> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId || this._accionEnCurso()) return false;

    this._accionEnCurso.set(slotId ? `franja-${slotId}-guardar` : 'franja-crear');
    this._errorOperacion.set(null);

    try {
      if (slotId) {
        await this.gestionEscolarService.editarFranja(schoolId, slotId, payload);
        this.toastService.mostrar('Franja horaria actualizada.', 'success');
      } else {
        await this.gestionEscolarService.crearFranja(schoolId, payload);
        this.toastService.mostrar('Franja horaria creada.', 'success');
      }
      await this.cargarFranjas();
      return true;
    } catch (err: unknown) {
      this.mostrarErrorOperacion(err, 'No pudimos guardar la franja horaria.');
      return false;
    } finally {
      this._accionEnCurso.set(null);
    }
  }

  public async eliminarFranja(slotId: string): Promise<boolean> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId || this._accionEnCurso()) return false;

    this._accionEnCurso.set(`franja-${slotId}-eliminar`);
    this._errorOperacion.set(null);

    try {
      await this.gestionEscolarService.eliminarFranja(schoolId, slotId);
      this.toastService.mostrar('Franja horaria dada de baja.', 'success');
      await this.cargarFranjas();
      return true;
    } catch (err: unknown) {
      this.mostrarErrorOperacion(err, 'No pudimos dar de baja la franja horaria.');
      return false;
    } finally {
      this._accionEnCurso.set(null);
    }
  }

  public async reactivarFranja(slotId: string): Promise<boolean> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId || this._accionEnCurso()) return false;

    this._accionEnCurso.set(`franja-${slotId}-reactivar`);
    this._errorOperacion.set(null);

    try {
      await this.gestionEscolarService.reactivarFranja(schoolId, slotId);
      this.toastService.mostrar('Franja horaria reactivada.', 'success');
      await this.cargarFranjas();
      return true;
    } catch (err: unknown) {
      this.mostrarErrorOperacion(err, 'No pudimos reactivar la franja horaria.');
      return false;
    } finally {
      this._accionEnCurso.set(null);
    }
  }

  public volver(): void {
    this.router.navigate(['/directivo']);
  }

  private async cargarNiveles(): Promise<void> {
    const niveles = await this.gestionEscolarService.obtenerNiveles();
    this._niveles.set(niveles.filter((nivel) => nivel.activo));
  }

  private async cargarGrados(): Promise<void> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId) return;

    this._loadingGrados.set(true);
    this._errorGrados.set(null);

    try {
      const grados = await this.gestionEscolarService.listarGrados(schoolId, true);
      this._grados.set(grados);
    } catch (err: unknown) {
      this._errorGrados.set(this.mapearError(err, 'No pudimos cargar los grados.'));
    } finally {
      this._loadingGrados.set(false);
    }
  }

  private async cargarFranjas(): Promise<void> {
    const schoolId = this.obtenerSchoolId();
    if (!schoolId) return;

    this._loadingFranjas.set(true);
    this._errorFranjas.set(null);

    try {
      const franjas = await this.gestionEscolarService.listarFranjas(schoolId, true);
      this._franjas.set(franjas);
    } catch (err: unknown) {
      this._errorFranjas.set(this.mapearError(err, 'No pudimos cargar las franjas horarias.'));
    } finally {
      this._loadingFranjas.set(false);
    }
  }

  private obtenerSchoolId(): string | null {
    return this._schoolOverview()?.id ?? null;
  }

  private mostrarErrorOperacion(err: unknown, fallback: string): void {
    const mensaje = this.mapearError(err, fallback);
    this._errorOperacion.set(mensaje);
    this.toastService.mostrar(mensaje, 'error');
  }

  private mapearError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const backendMsg = this.mensajeBackend(err);
      if (backendMsg) return backendMsg;

      const code = this.codigoBackend(err);
      if (code === 'TIME_SLOT_OVERLAP') return 'Ya existe una franja activa en ese horario.';
      if (code === 'TIME_SLOT_IN_USE') return 'La franja tiene compras futuras activas.';
      if (code === 'INVALID_TIME_SLOT') return 'La franja horaria no es válida.';
      if (code === 'GRADE_ALREADY_EXISTS') return 'Ya existe un grado activo con esos datos.';
      if (code === 'INVALID_GRADE') return 'Los datos del grado no son válidos.';
      if (code === 'FORBIDDEN' || err.status === 403) return 'No tenes permisos para administrar este colegio.';
      if (err.status === 404) return 'No encontramos el recurso solicitado.';
      if (err.status >= 500) return 'Error del servidor. Intenta más tarde.';
    }
    return fallback;
  }

  private mensajeBackend(err: HttpErrorResponse): string {
    const body = err.error;
    if (typeof body === 'string') return body;
    if (!body || typeof body !== 'object') return '';

    const record = body as { mensaje?: unknown; message?: unknown; error?: unknown };
    return String(record.mensaje ?? record.message ?? '').trim();
  }

  private codigoBackend(err: HttpErrorResponse): string {
    const body = err.error;
    if (!body || typeof body !== 'object') return '';
    return String((body as { code?: unknown }).code ?? '').trim();
  }
}

