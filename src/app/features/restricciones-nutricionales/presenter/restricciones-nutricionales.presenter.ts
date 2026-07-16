import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ClasificacionSaludBackend,
  RestriccionesNutricionalesService,
} from '../services/restricciones-nutricionales.service';
import {
  ClaveRestriccion,
  RESTRICCIONES_CATALOGO,
  RestriccionesNutricionales,
  normalizarDescripcion,
  restriccionesPorDefecto,
} from '../models/restricciones-nutricionales.model';

@Injectable()
export class RestriccionesNutricionalesPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly restriccionesService = inject(RestriccionesNutricionalesService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly restriccionesState = signal<RestriccionesNutricionales>(
    restriccionesPorDefecto(),
  );

  private readonly cargandoState = signal(false);
  private readonly guardandoState = signal(false);

  private alumnoId = '';
  private idPorClave = new Map<ClaveRestriccion, string>();

  readonly catalogo = RESTRICCIONES_CATALOGO;
  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly restricciones: Signal<RestriccionesNutricionales> =
    this.restriccionesState.asReadonly();

  readonly cargando = this.cargandoState.asReadonly();
  readonly guardando = this.guardandoState.asReadonly();

  readonly nombreCompleto = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return alumno.nombre.trim();
  });

  readonly urlFotoPerfil = computed<string | null>(() => this.alumnoState()?.urlFotoPerfil ?? null);

  readonly grado = computed(() => this.alumnoState()?.grado ?? '');

  readonly iniciales = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return (alumno.nombre[0] ?? '').toUpperCase();
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
      this.alumnoId = alumnoId;
      this.alumnoState.set(alumno);
      const [catalogo, activas] = await Promise.all([
        this.restriccionesService.getCatalogo(),
        this.restriccionesService.getRestriccionesAlumno(alumnoId)
      ]);
      this.idPorClave = this.construirMapeo(catalogo);
      this.restriccionesState.set(this.proyectarActivas(activas));

    } catch (error) {
      console.error('[RestriccionesNutricionales] error cargando', error);
      this.toastService.mostrar('No pudimos cargar las restricciones del alumno.', 'error');
    } finally {
      this.cargandoState.set(false);
    }
  }


  alternar(clave: ClaveRestriccion): void {
    const actual = this.restriccionesState();
    this.restriccionesState.set({ ...actual, [clave]: !actual[clave] });
  }

  async guardar(): Promise<void> {
    if (!this.alumnoId || this.guardandoState()) return;
    const ids = this.idsSeleccionados();
    this.guardandoState.set(true);
    try {
      await this.restriccionesService.actualizarRestricciones(this.alumnoId, ids);

      this.toastService.mostrar('Restricciones actualizadas.', 'success');
      this.router.navigateByUrl('/tutor');
    } catch (error) {
      console.error('[RestriccionesNutricionales] error guardando', error);
      this.toastService.mostrar('No pudimos guardar los cambios. Probá de nuevo.', 'error');
    } finally {
      this.guardandoState.set(false);
    }
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }

  private construirMapeo(
    catalogo: readonly ClasificacionSaludBackend[],
  ): Map<ClaveRestriccion, string> {
    const mapeo = new Map<ClaveRestriccion, string>();
    for (const descriptor of RESTRICCIONES_CATALOGO) {
      const match = catalogo.find((c) => {
        if (c.activo === false) return false;
        const descripcion = normalizarDescripcion(c.descripcion ?? '');
        return descriptor.palabrasClave.some((palabra) => descripcion.includes(palabra));
      });
      if (match) {
        mapeo.set(descriptor.clave, match.id);
      }
    }
    return mapeo;
  }

  private proyectarActivas(
    activas: readonly ClasificacionSaludBackend[],
  ): RestriccionesNutricionales {
    const idsActivos = new Set(activas.map((c) => c.id));
    const base = restriccionesPorDefecto();
    for (const [clave, id] of this.idPorClave) {
      if (idsActivos.has(id)) {
        base[clave] = true;
      }
    }
    return base;
  }

  private idsSeleccionados(): string[] {
    const estado = this.restriccionesState();
    const ids: string[] = [];
    for (const [clave, id] of this.idPorClave) {
      if (estado[clave]) ids.push(id);
    }
    return ids;
  }
}
