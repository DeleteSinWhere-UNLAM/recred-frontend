import { Injectable, computed, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AcreditarMercadoPagoService } from '../services/acreditar-mercado-pago.service';
import { BilleteraService } from '../../billetera/services/billetera.service';
import { firstValueFrom } from 'rxjs';

export interface RecargaVM {
  id: string;
  montoFormateado: string;
  fechaFormateada: string;
  estado: string;
}

@Injectable()
export class AcreditarMercadoPagoPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly mercadoPagoService = inject(AcreditarMercadoPagoService);
  private readonly billeteraService = inject(BilleteraService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly cargandoState = signal(false);
  private readonly historialRecargasState = signal<RecargaVM[]>([]);

  readonly alumno = this.alumnoState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly historialRecargas = this.historialRecargasState.asReadonly();

  readonly nombreCompleto = computed(() => {
    const alumno = this.alumnoState();
    return alumno ? alumno.nombre.split(' ')[0] : '';
  });

  readonly grado = computed(() => this.alumnoState()?.grado ?? '');

  readonly urlFotoPerfil = computed(() => this.alumnoState()?.urlFotoPerfil ?? null);

  readonly iniciales = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return ((alumno.nombre[0] ?? '') + (alumno.apellido[0] ?? '')).toUpperCase();
  });

  async init(alumnoId: string): Promise<void> {
    this.cargandoState.set(true);
    try {
      await this.alumnosService.asegurarCargados();
      const alumno = this.alumnosService.getAlumnoById(alumnoId);
      if (!alumno) {
        this.router.navigateByUrl('/tutor');
        return;
      }
      this.alumnoState.set(alumno);

      // Cargar historial de billetera
      const resumen = await firstValueFrom(this.billeteraService.getResumen(alumnoId));
      if (resumen && resumen.movimientos) {
        const recargas = resumen.movimientos
          .filter(m => m.direccion === 'ENTRADA')
          .map(m => {
            const date = new Date(m.fechaHora);
            const formatter = new Intl.DateTimeFormat('es-AR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
            return {
              id: m.id,
              montoFormateado: `$${m.monto.toLocaleString('es-AR')}`,
              fechaFormateada: formatter.format(date),
              estado: 'APROBADO' // Asumimos aprobado si ya está en la billetera
            };
          });
        this.historialRecargasState.set(recargas);
      }
    } catch (error) {
      console.error('[AcreditarMercadoPago] error cargando', error);
      this.toastService.mostrar(
        'No pudimos cargar la información del alumno.',
        'error',
      );
    } finally {
      this.cargandoState.set(false);
    }
  }

  async acreditar(monto: number): Promise<void> {
    if (this.cargandoState()) return;
    const alumno = this.alumnoState();
    if (!alumno) return;

    if (monto <= 0) {
      this.toastService.mostrar('El monto debe ser mayor a 0.', 'error');
      return;
    }

    this.cargandoState.set(true);
    try {
      const paymentUrl = await this.mercadoPagoService.generarLinkPago(alumno.id, monto);
      if (paymentUrl) {
        this.document.location.href = paymentUrl;
      } else {
        throw new Error('No se recibió la URL de pago.');
      }
    } catch (error) {
      console.error('[AcreditarMercadoPago] error generando link', error);
      this.toastService.mostrar(
        'Hubo un problema al contactar con Mercado Pago. Probá de nuevo más tarde.',
        'error',
      );
    } finally {
      this.cargandoState.set(false);
    }
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}
