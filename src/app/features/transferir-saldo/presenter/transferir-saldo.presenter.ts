import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BilleteraService } from '../../billetera/services/billetera.service';
import { firstValueFrom } from 'rxjs';

export interface TransferenciaVM {
  id: string;
  montoFormateado: string;
  fechaFormateada: string;
  descripcion: string;
  tipo: 'ENVIADA' | 'RECIBIDA';
  estado: string;
}

@Injectable()
export class TransferirSaldoPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly billeteraService = inject(BilleteraService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private readonly alumnoOrigenState = signal<Alumno | undefined>(undefined);
  private readonly cargandoState = signal(false);
  private readonly historialTransferenciasState = signal<TransferenciaVM[]>([]);

  readonly alumnoOrigen = this.alumnoOrigenState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly historialTransferencias = this.historialTransferenciasState.asReadonly();

  readonly nombreCompleto = computed(() => {
    const alumno = this.alumnoOrigenState();
    if (!alumno) return '';
    return (alumno.nombre || '').trim().split(' ')[0];
  });

  readonly grado = computed(() => this.alumnoOrigenState()?.grado ?? '');
  readonly urlFotoPerfil = computed(() => this.alumnoOrigenState()?.urlFotoPerfil ?? null);

  readonly otrosHijos = computed(() => {
    const origen = this.alumnoOrigenState();
    if (!origen) return [];
    return this.alumnosService.alumnos().filter((a) => a.id !== origen.id);
  });

  formatShortName(alumno: Alumno): string {
    if (!alumno) return '';
    return (alumno.nombre || '').trim().split(' ')[0];
  }

  async init(alumnoId: string): Promise<void> {
    this.cargandoState.set(true);
    try {
      await this.alumnosService.asegurarCargados();
      const alumno = this.alumnosService.getAlumnoById(alumnoId);
      if (!alumno) {
        this.router.navigateByUrl('/tutor');
        return;
      }
      this.alumnoOrigenState.set(alumno);

      const resumen = await firstValueFrom(this.billeteraService.getResumen(alumnoId));
      if (resumen && resumen.movimientos) {
        const transferencias = resumen.movimientos
          .filter(
            (m) =>
              m.tipo === 'AJUSTE' &&
              (m.descripcion.toLowerCase().includes('transferencia enviada') ||
                m.descripcion.toLowerCase().includes('transferencia recibida')),
          )
          .map((m) => {
            const date = new Date(m.fechaHora);
            const formatter = new Intl.DateTimeFormat('es-AR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            });
            const esSalida = m.direccion === 'SALIDA' || m.monto < 0;
            return {
              id: m.id,
              montoFormateado: `${esSalida ? '-' : '+'} $${Math.abs(m.monto).toLocaleString('es-AR')}`,
              fechaFormateada: formatter.format(date),
              descripcion: m.descripcion,
              tipo: (esSalida ? 'ENVIADA' : 'RECIBIDA') as 'ENVIADA' | 'RECIBIDA',
              estado: 'APROBADO',
            };
          });
        this.historialTransferenciasState.set(transferencias);
      }
    } catch (error) {
      console.error('[TransferirSaldoPresenter] error cargando', error);
      this.toastService.mostrar(
        'No pudimos cargar la información del alumno.',
        'error',
      );
    } finally {
      this.cargandoState.set(false);
    }
  }

  async transferir(toStudentId: string, amount: number): Promise<boolean> {
    if (this.cargandoState()) return false;
    const origen = this.alumnoOrigenState();
    if (!origen) return false;

    if (!toStudentId) {
      this.toastService.mostrar('Debes seleccionar un hijo de destino.', 'error');
      return false;
    }

    if (amount <= 0) {
      this.toastService.mostrar('El monto debe ser mayor a 0.', 'error');
      return false;
    }

    const numAmount = Number(amount);
    const numSaldo = Number(origen.saldo);

    if (numAmount > numSaldo + 0.01) {
      this.toastService.mostrar('El monto a transferir no puede superar el saldo actual.', 'error');
      return false;
    }

    this.cargandoState.set(true);
    try {
      await firstValueFrom(this.billeteraService.transferirSaldo(origen.id, toStudentId, amount));
      this.toastService.mostrar('Transferencia realizada correctamente.', 'success');

      await this.alumnosService.cargarHijosDelTutor();

      await this.init(origen.id);
      return true;
    } catch (error) {
      console.error('[TransferirSaldoPresenter] error realizando transferencia', error);
      this.toastService.mostrar(
        'Hubo un problema al realizar la transferencia. Intentá de nuevo más tarde.',
        'error',
      );
      return false;
    } finally {
      this.cargandoState.set(false);
    }
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}
