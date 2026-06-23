import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import {
  BilleteraResumen,
  GastoPorCategoria,
  GastoPorClasificacionSalud,
  MovimientoBilletera,
} from '../models/billetera.model';
import { BilleteraService } from '../services/billetera.service';

export type RangoFecha = 'hoy' | 'semana' | 'mes' | 'custom';

const formateadorMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

const formateadorFechaMovimiento = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const formateadorFechaPeriodo = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'medium',
});

function aIsoDate(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function inicioDeHoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function inicioDeSemana(): Date {
  const d = inicioDeHoy();
  const diaSemana = d.getDay();
  const offset = diaSemana === 0 ? 6 : diaSemana - 1;
  d.setDate(d.getDate() - offset);
  return d;
}

function inicioDeMes(): Date {
  const d = inicioDeHoy();
  d.setDate(1);
  return d;
}

@Injectable()
export class BilleteraPresenter {
  private readonly billeteraService = inject(BilleteraService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly perfilService = inject(PerfilService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  private readonly resumenState = signal<BilleteraResumen | null>(null);
  private readonly cargandoState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  private readonly alumnoIdState = signal<string>('');
  private readonly rangoFechaState = signal<RangoFecha>('mes');
  private readonly desdeState = signal<string>('');
  private readonly hastaState = signal<string>('');

  readonly resumen: Signal<BilleteraResumen | null> = this.resumenState.asReadonly();
  readonly cargando: Signal<boolean> = this.cargandoState.asReadonly();
  readonly error: Signal<string | null> = this.errorState.asReadonly();
  readonly rangoFecha: Signal<RangoFecha> = this.rangoFechaState.asReadonly();
  readonly desde: Signal<string> = this.desdeState.asReadonly();
  readonly hasta: Signal<string> = this.hastaState.asReadonly();

  readonly nombreAlumno = computed(() => {
    const alumno = this.alumnosService.getAlumnoById(this.alumnoIdState());
    if (!alumno) return '';
    return this.usuarioService.esVistaAlumno() ? `${alumno.nombre} ${alumno.apellido}` : alumno.nombre;
  });

  readonly urlFotoPerfil = computed(() => {
    const alumno = this.alumnosService.getAlumnoById(this.alumnoIdState());
    return alumno?.urlFotoPerfil ?? null;
  });

  readonly iniciales = computed(() => {
    const alumno = this.alumnosService.getAlumnoById(this.alumnoIdState());
    if (!alumno) return '';
    if (this.usuarioService.esVistaAlumno()) {
      return ((alumno.nombre[0] ?? '') + (alumno.apellido[0] ?? '')).toUpperCase();
    }
    return (alumno.nombre[0] ?? '').toUpperCase();
  });

  readonly saldoActualFormateado = computed(() =>
    formateadorMoneda.format(this.resumenState()?.saldoActual ?? 0),
  );

  readonly saldoNegativo = computed(
    () => (this.resumenState()?.saldoActual ?? 0) < 0,
  );

  readonly montoIngresadoFormateado = computed(() =>
    formateadorMoneda.format(this.resumenState()?.montoIngresado ?? 0),
  );

  readonly montoGastadoFormateado = computed(() =>
    formateadorMoneda.format(this.resumenState()?.montoGastado ?? 0),
  );

  readonly balancePeriodoFormateado = computed(() => {
    const balance = this.resumenState()?.balancePeriodo ?? 0;
    const signo = balance > 0 ? '+' : balance < 0 ? '-' : '';
    return `${signo}${formateadorMoneda.format(Math.abs(balance))}`;
  });

  readonly balancePositivo = computed(
    () => (this.resumenState()?.balancePeriodo ?? 0) >= 0,
  );

  readonly cantidadCompras = computed(
    () => this.resumenState()?.cantidadCompras ?? 0,
  );

  readonly periodoLabel = computed(() => {
    const resumen = this.resumenState();
    if (!resumen) return '';
    const desde = this.aFecha(resumen.periodo.desde);
    const hasta = this.aFecha(resumen.periodo.hasta);
    if (!desde || !hasta) return '';
    return `${formateadorFechaPeriodo.format(desde)} – ${formateadorFechaPeriodo.format(hasta)}`;
  });

  readonly gastoPorCategoria: Signal<GastoPorCategoria[]> = computed(
    () => this.resumenState()?.gastoPorCategoria ?? [],
  );

  readonly gastoPorClasificacionSalud: Signal<GastoPorClasificacionSalud[]> =
    computed(() => this.resumenState()?.gastoPorClasificacionSalud ?? []);

  readonly movimientos: Signal<MovimientoBilletera[]> = computed(
    () => this.resumenState()?.movimientos ?? [],
  );

  readonly hayMovimientos = computed(() => this.movimientos().length > 0);
  readonly hayCategorias = computed(() => this.gastoPorCategoria().length > 0);
  readonly hayClasificacionSalud = computed(
    () => this.gastoPorClasificacionSalud().length > 0,
  );

  init(alumnoIdRuta: string | null): void {
    void this.alumnosService.asegurarCargados().then(() => {
      const id = this.resolverAlumnoId(alumnoIdRuta);
      if (!id) {
        this.errorState.set('No se pudo identificar al alumno');
        return;
      }
      this.alumnoIdState.set(id);
      this.aplicarRangoFecha(this.rangoFechaState());
    });
  }

  cambiarFecha(rango: RangoFecha): void {
    this.rangoFechaState.set(rango);
    if (rango !== 'custom') {
      this.aplicarRangoFecha(rango);
    }
  }

  setearRango(desde: string, hasta: string): void {
    this.rangoFechaState.set('custom');
    this.desdeState.set(desde);
    this.hastaState.set(hasta);
    if (desde && hasta) {
      this.cargarResumen();
    }
  }

  recargar(): void {
    this.cargarResumen();
  }

  formatearMonto(monto: number): string {
    return formateadorMoneda.format(monto);
  }

  formatearMontoConSigno(movimiento: MovimientoBilletera): string {
    const signo = movimiento.direccion === 'ENTRADA' ? '+' : '-';
    return `${signo}${formateadorMoneda.format(Math.abs(movimiento.monto))}`;
  }

  formatearFechaMovimiento(fechaHora: string): string {
    const fecha = this.aFecha(fechaHora);
    return fecha ? formateadorFechaMovimiento.format(fecha) : '';
  }

  iconoMovimiento(tipo: string): string {
    switch (tipo) {
      case 'CARGA':
        return 'fa-arrow-down';
      case 'COMPRA':
        return 'fa-bag-shopping';
      case 'REEMBOLSO':
        return 'fa-rotate-left';
      case 'TRANSFERENCIA':
        return 'fa-right-left';
      default:
        return 'fa-circle-info';
    }
  }

  volver(): void {
    if (this.usuarioService.esVistaAlumno()) {
      this.router.navigateByUrl('/alumno');
    } else {
      this.router.navigateByUrl('/tutor');
    }
  }

  private aplicarRangoFecha(rango: RangoFecha): void {
    const hoy = inicioDeHoy();
    const hasta = new Date();
    let desde: Date;

    switch (rango) {
      case 'hoy':
        desde = hoy;
        break;
      case 'semana':
        desde = inicioDeSemana();
        break;
      case 'mes':
      default:
        desde = inicioDeMes();
        break;
    }

    this.desdeState.set(aIsoDate(desde));
    this.hastaState.set(aIsoDate(hasta));
    this.cargarResumen();
  }

  private cargarResumen(): void {
    const id = this.alumnoIdState();
    if (!id) return;

    this.cargandoState.set(true);
    this.errorState.set(null);

    this.billeteraService
      .getResumen(id, this.desdeState(), this.hastaState())
      .subscribe({
        next: (resumen) => {
          this.resumenState.set(resumen);
          this.cargandoState.set(false);
        },
        error: (err) => {
          console.error('Error al obtener resumen de billetera', err);
          this.errorState.set('No se pudo cargar la billetera');
          this.cargandoState.set(false);
        },
      });
  }

  private resolverAlumnoId(alumnoIdRuta: string | null): string {
    if (alumnoIdRuta) return alumnoIdRuta;
    const desdePerfil = this.perfilService.obtenerAlumnoId();
    if (desdePerfil) return desdePerfil;
    return this.usuarioService.getAlumnoActual().id;
  }

  private aFecha(valor: string | undefined): Date | null {
    if (!valor) return null;
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }
}
