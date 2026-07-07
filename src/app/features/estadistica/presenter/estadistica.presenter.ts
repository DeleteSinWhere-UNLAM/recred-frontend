import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import {
  NivelAlerta,
  PrediccionGasto,
  nivelAlertaDePorcentaje,
} from '../../presupuesto/models/presupuesto.model';
import { PresupuestoService } from '../../presupuesto/services/presupuesto.service';
import { MovimientosService } from '../../movimientos/services/movimientos.service';
import { Movimiento } from '../../movimientos/models/movimiento.model';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EstadisticaPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly movimientosService = inject(MovimientosService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly prediccionState = signal<PrediccionGasto | undefined>(undefined);
  private readonly historialState = signal<Movimiento[]>([]);

  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly prediccion: Signal<PrediccionGasto | undefined> = this.prediccionState.asReadonly();
  readonly historial: Signal<Movimiento[]> = this.historialState.asReadonly();

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

  readonly nivelAlerta: Signal<NivelAlerta> = computed(() => {
    const p = this.prediccionState();
    if (!p) return 'ok';
    return nivelAlertaDePorcentaje(p.porcentajePresupuesto);
  });

  async init(alumnoId: string): Promise<void> {
    const alumno = this.alumnosService.getAlumnoById(alumnoId);
    if (!alumno) {
      this.router.navigateByUrl('/tutor');
      return;
    }
    this.alumnoState.set(alumno);
    
    try {
      const prediccion = await this.presupuestoService.cargarPrediccion(alumnoId, 'MENSUAL');
      this.prediccionState.set(prediccion);
    } catch (e) {
      console.error('Error al cargar la predicción:', e);
      this.prediccionState.set(undefined);
    }
    
    try {
      const movimientos = await firstValueFrom(this.movimientosService.getHistorialAlumno(alumnoId));
      this.historialState.set(movimientos);
    } catch (e) {
      console.error('Error al cargar el historial:', e);
      this.historialState.set([]);
    }
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}
