import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { RestriccionesService } from '../services/restricciones.service';
import {
  ClaveRestriccion,
  RESTRICCIONES_CATALOGO,
  RestriccionesNutricionales,
  restriccionesPorDefecto,
} from '../models/restricciones-nutricionales.model';

@Injectable()
export class RestriccionesPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly restriccionesService = inject(RestriccionesService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly restriccionesState = signal<RestriccionesNutricionales>(
    restriccionesPorDefecto('')
  );

  readonly catalogo = RESTRICCIONES_CATALOGO;
  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly restricciones: Signal<RestriccionesNutricionales> =
    this.restriccionesState.asReadonly();

  readonly nombreCompleto = computed(() => {
    const alumno = this.alumnoState();
    return alumno ? `${alumno.nombre} ${alumno.apellido}` : '';
  });

  readonly grado = computed(() => this.alumnoState()?.grado ?? '');

  readonly iniciales = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return ((alumno.nombre[0] ?? '') + (alumno.apellido[0] ?? '')).toUpperCase();
  });

  init(alumnoId: string): void {
    const alumno = this.alumnosService.getAlumnoById(alumnoId);
    if (!alumno) {
      this.router.navigateByUrl('/tutor');
      return;
    }
    this.alumnoState.set(alumno);
    this.restriccionesState.set(
      this.restriccionesService.getRestricciones(alumnoId)
    );
  }

  alternar(clave: ClaveRestriccion): void {
    const actual = this.restriccionesState();
    this.restriccionesState.set({ ...actual, [clave]: !actual[clave] });
  }

  guardar(): void {
    this.restriccionesService.guardar(this.restriccionesState());
    this.router.navigateByUrl('/tutor');
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}
