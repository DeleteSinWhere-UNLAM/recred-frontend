import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { Perfil } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { SubscriptionPaymentService } from '../../../data-access/services/suscripciones/subscription-payment.service';
import { ToastService } from '../../../shared/services/toast.service';
import { SchoolOverview } from '../models/directivo.model';
import { DirectivoService } from '../services/directivo.service';

@Injectable()
export class DirectivoPresenter {
  private readonly perfilService = inject(PerfilService);
  private readonly directivoService = inject(DirectivoService);
  private readonly subscriptionPaymentService = inject(SubscriptionPaymentService);
  private readonly toastService = inject(ToastService);
  
  private readonly _mensajeBienvenida = signal<string>('Cargando...');
  private readonly _schoolOverview = signal<SchoolOverview | null>(null);
  private readonly _perfilDirectivo = signal<Perfil | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);
  private readonly _pagandoLicencia = signal<boolean>(false);
  private readonly _errorPagoLicencia = signal<string | null>(null);
  
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

  public get pagandoLicencia(): Signal<boolean> {
    return this._pagandoLicencia.asReadonly();
  }

  public get errorPagoLicencia(): Signal<string | null> {
    return this._errorPagoLicencia.asReadonly();
  }

  public async inicializar(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const perfil = await this.perfilService.cargarPerfil();
      this._perfilDirectivo.set(perfil);
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

  public async pagarLicenciaColegio(): Promise<void> {
    if (this._pagandoLicencia()) return;

    const colegioId = this.obtenerColegioId();
    if (!colegioId) {
      const mensaje = 'No se encontro el colegio asociado al usuario.';
      this._errorPagoLicencia.set(mensaje);
      this.toastService.mostrar(mensaje, 'error');
      return;
    }

    this._pagandoLicencia.set(true);
    this._errorPagoLicencia.set(null);

    try {
      const respuesta = await this.subscriptionPaymentService.crearPagoSuscripcionColegio({
        colegioId,
      });
      const checkoutUrl = respuesta.checkoutUrl || respuesta.paymentUrl;
      if (!checkoutUrl) {
        throw new Error('El backend no devolvio una URL de checkout.');
      }

      this.redirigirAPago(checkoutUrl);
    } catch (err) {
      console.error('Error creando el pago de licencia del colegio:', err);
      const mensaje = 'No pudimos iniciar el pago de la licencia.';
      this._errorPagoLicencia.set(mensaje);
      this.toastService.mostrar(mensaje, 'error');
    } finally {
      this._pagandoLicencia.set(false);
    }
  }

  private obtenerColegioId(): string | null {
    const overview = this._schoolOverview();
    if (overview?.id?.trim()) return overview.id;

    const perfil = this._perfilDirectivo()
      ?? (this.perfilService as unknown as { getPerfil?: () => Perfil | null }).getPerfil?.()
      ?? null;
    return (
      perfil?.colegioId
      ?? perfil?.schoolId
      ?? perfil?.colegio?.id
      ?? perfil?.school?.id
      ?? null
    );
  }

  private redirigirAPago(url: string): void {
    window.location.href = url;
  }
}
