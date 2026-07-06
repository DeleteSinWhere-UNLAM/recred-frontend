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

@Injectable()
export class EstadisticaPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly prediccionState = signal<PrediccionGasto | undefined>(undefined);

  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly prediccion: Signal<PrediccionGasto | undefined> = this.prediccionState.asReadonly();

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
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}
