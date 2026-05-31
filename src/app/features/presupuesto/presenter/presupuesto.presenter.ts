import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { ToastService } from '../../../shared/services/toast.service';
import { CategoriaProducto } from '../../buffet/models/producto.model';
import { PresupuestoService } from '../services/presupuesto.service';
import {
  NivelAlerta,
  PERIODOS,
  Periodo,
  PrediccionGasto,
  Presupuesto,
  ReglaCategoria,
  nivelAlertaDePorcentaje,
  presupuestoPorDefecto,
  recalcularMontosReglas,
  sumaPorcentajes,
} from '../models/presupuesto.model';

@Injectable()
export class PresupuestoPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly presupuestoState = signal<Presupuesto>(
    presupuestoPorDefecto(''),
  );
  private readonly prediccionState = signal<PrediccionGasto | undefined>(
    undefined,
  );
  private readonly categoriasDisponiblesState = signal<CategoriaProducto[]>([]);

  readonly periodos = PERIODOS;
  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly presupuesto: Signal<Presupuesto> = this.presupuestoState.asReadonly();
  readonly prediccion: Signal<PrediccionGasto | undefined> =
    this.prediccionState.asReadonly();
  readonly categoriasDisponibles: Signal<CategoriaProducto[]> =
    this.categoriasDisponiblesState.asReadonly();

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

  readonly reglas: Signal<ReglaCategoria[]> = computed(
    () => this.presupuestoState().reglasCategoria,
  );

  readonly totalPorcentaje = computed(() =>
    sumaPorcentajes(this.presupuestoState().reglasCategoria),
  );

  readonly porcentajeValido = computed(() => this.totalPorcentaje() <= 100);

  readonly nivelAlerta: Signal<NivelAlerta> = computed(() => {
    const p = this.prediccionState();
    if (!p) return 'ok';
    return nivelAlertaDePorcentaje(p.porcentajePresupuesto);
  });

  readonly categoriasUsables = computed<CategoriaProducto[]>(() => {
    const yaUsadas = new Set(
      this.presupuestoState().reglasCategoria.map((r) => r.categoriaId),
    );
    return this.categoriasDisponiblesState().filter(
      (c) => !yaUsadas.has(c.id),
    );
  });

  readonly puedeAgregarRegla = computed(
    () => this.categoriasUsables().length > 0,
  );

  init(alumnoId: string): void {
    const alumno = this.alumnosService.getAlumnoById(alumnoId);
    if (!alumno) {
      this.router.navigateByUrl('/tutor');
      return;
    }
    this.alumnoState.set(alumno);
    this.presupuestoState.set(this.presupuestoService.getPresupuesto(alumnoId));
    this.prediccionState.set(this.presupuestoService.getPrediccion(alumnoId));
    this.categoriasDisponiblesState.set(
      this.presupuestoService.getCategoriasDisponibles(),
    );
  }

  setMontoGeneral(monto: number): void {
    const seguro = Number.isFinite(monto) && monto >= 0 ? monto : 0;
    this.presupuestoState.update((actual) =>
      recalcularMontosReglas({ ...actual, montoLimiteGeneral: seguro }),
    );
  }

  setPeriodo(periodo: Periodo): void {
    this.presupuestoState.update((actual) => ({ ...actual, periodo }));
  }

  setFechaInicio(fechaInicio: string): void {
    this.presupuestoState.update((actual) => ({ ...actual, fechaInicio }));
  }

  agregarReglaCategoria(categoriaId: string): void {
    const categoria = this.categoriasDisponiblesState().find(
      (c) => c.id === categoriaId,
    );
    if (!categoria) return;
    const yaExiste = this.presupuestoState().reglasCategoria.some(
      (r) => r.categoriaId === categoriaId,
    );
    if (yaExiste) return;
    const nuevaRegla: ReglaCategoria = {
      id: `r-${categoriaId}-${Date.now()}`,
      categoriaId: categoria.id,
      descripcionCategoria: categoria.descripcion,
      porcentajeLimite: 0,
      montoLimiteCalculado: 0,
      activo: true,
    };
    this.presupuestoState.update((actual) =>
      recalcularMontosReglas({
        ...actual,
        reglasCategoria: [...actual.reglasCategoria, nuevaRegla],
      }),
    );
  }

  setPorcentajeRegla(reglaId: string, porcentaje: number): void {
    const seguro = clamp(porcentaje, 0, 100);
    this.presupuestoState.update((actual) =>
      recalcularMontosReglas({
        ...actual,
        reglasCategoria: actual.reglasCategoria.map((r) =>
          r.id === reglaId ? { ...r, porcentajeLimite: seguro } : r,
        ),
      }),
    );
  }

  eliminarRegla(reglaId: string): void {
    this.presupuestoState.update((actual) => ({
      ...actual,
      reglasCategoria: actual.reglasCategoria.filter((r) => r.id !== reglaId),
    }));
  }

  guardar(): void {
    if (!this.porcentajeValido()) {
      this.toastService.mostrar(
        'La suma de porcentajes no puede superar 100%.',
        'error',
      );
      return;
    }
    this.presupuestoService.guardar(this.presupuestoState());
    this.toastService.mostrar('Presupuesto guardado.', 'success');
  }

  desactivar(): void {
    const alumnoId = this.alumnoState()?.id;
    if (!alumnoId) return;
    this.presupuestoService.desactivar(alumnoId);
    this.presupuestoState.update((actual) => ({ ...actual, activo: false }));
    this.toastService.mostrar('Presupuesto desactivado.', 'info');
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}

function clamp(valor: number, min: number, max: number): number {
  if (!Number.isFinite(valor)) return min;
  return Math.min(Math.max(valor, min), max);
}
