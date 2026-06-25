import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { CategoriaProducto } from '../../buffet/models/producto.model';
import {
  Periodo,
  PrediccionGasto,
  Presupuesto,
  ReglaCategoria,
  recalcularMontosReglas,
} from '../models/presupuesto.model';

export interface DateBudgetStatus {
  readonly date: string;
  readonly blocked: boolean;
  readonly reason: string | null;
}

export interface CheckBudgetDatesResponse {
  readonly validationResults: readonly DateBudgetStatus[];
}

interface CategoriaBackend {
  readonly id: string;
  readonly descripcion: string;
  readonly activo?: boolean;
}

interface ReglaCategoriaBackend {
  readonly id: string;
  readonly categoria: CategoriaBackend;
  readonly porcentajeLimite: number;
  readonly montoLimiteCalculado: number;
  readonly activo: boolean;
}

interface PresupuestoBackend {
  readonly id: string;
  readonly alumnoId: string;
  readonly montoLimiteGeneral: number;
  readonly periodo: Periodo;
  readonly fechaInicio: string;
  readonly activo: boolean;
  readonly reglasCategoria: readonly ReglaCategoriaBackend[];
}

interface CategoryRuleCommand {
  readonly categoryId: string;
  readonly porcentajeLimite: number;
}

interface BudgetCommand {
  readonly studentId: string;
  readonly creadorId: string;
  readonly limitAmount: number;
  readonly period: Periodo;
  readonly startDate: string;
  readonly categoryRules: readonly CategoryRuleCommand[];
}

interface CategoriaConsumidaBackend {
  readonly descripcion: string;
  readonly montoTotal: number;
}

interface AnalisisIaBackend {
  readonly resumen?: string;
  readonly alertas?: readonly string[];
  readonly recomendaciones?: readonly string[];
  readonly modelo?: string;
}

interface PrediccionBackend {
  readonly alumnoId: string;
  readonly periodo: Periodo;
  readonly gastoActual: number;
  readonly gastoPredicho: number;
  readonly promedioGastoDiario: number;
  readonly montoLimite: number;
  readonly porcentajePresupuesto: number;
  readonly confianza: number;
  readonly diasRestantes: number;
  readonly categoriasMasConsumidas?: readonly CategoriaConsumidaBackend[];
  readonly analisisIa?: AnalisisIaBackend;
}

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);
  private readonly apiBase = environment.apiUrl;
  private readonly iaBase = `${environment.apiUrl}/ia`;

  async getPresupuesto(alumnoId: string): Promise<Presupuesto | undefined> {
    const backend = await firstValueFrom(
      this.http
        .get<PresupuestoBackend>(
          `${this.apiBase}/budgets/student/${encodeURIComponent(alumnoId)}/active`,
        )
        .pipe(catchError((err) => this.recuperarNoEncontrado<PresupuestoBackend>(err))),
    );
    return backend ? this.mapearPresupuesto(backend) : undefined;
  }

  getPrediccion(_alumnoId: string): PrediccionGasto | undefined {
    void _alumnoId;
    return undefined;
  }

  async cargarPrediccion(
    alumnoId: string,
    periodo: Periodo,
  ): Promise<PrediccionGasto | undefined> {
    const backend = await firstValueFrom(
      this.http
        .get<PrediccionBackend>(
          `${this.iaBase}/alumnos/${encodeURIComponent(alumnoId)}/prediccion-gasto`,
          { params: { periodo } },
        )
        .pipe(catchError((err) => this.recuperarNoEncontrado<PrediccionBackend>(err))),
    );
    return backend ? this.mapearPrediccion(backend) : undefined;
  }

  async getCategoriasDisponibles(): Promise<CategoriaProducto[]> {
    const categorias = await firstValueFrom(
      this.http.get<readonly CategoriaBackend[]>(`${this.apiBase}/categories`),
    );
    return categorias
      .filter((c) => c.activo !== false)
      .map((c) => ({ id: c.id, descripcion: c.descripcion }));
  }

  async checkBudgetDates(
    alumnoId: string,
    dates: readonly string[],
    items: readonly { productId: string; quantity: number }[]
  ): Promise<readonly DateBudgetStatus[]> {
    const response = await firstValueFrom(
      this.http.post<CheckBudgetDatesResponse>(
        `${this.apiBase}/budgets/student/${encodeURIComponent(alumnoId)}/check-dates`,
        { dates, items }
      )
    );
    return response?.validationResults ?? [];
  }

  async guardar(presupuesto: Presupuesto): Promise<Presupuesto> {
    const command = this.construirCommand(presupuesto);
    const url = presupuesto.id
      ? `${this.apiBase}/budgets/${encodeURIComponent(presupuesto.id)}`
      : `${this.apiBase}/budgets`;
    const respuesta = await firstValueFrom(
      presupuesto.id
        ? this.http.put<PresupuestoBackend>(url, command)
        : this.http.post<PresupuestoBackend>(url, command),
    );
    return this.mapearPresupuesto(respuesta);
  }

  private construirCommand(presupuesto: Presupuesto): BudgetCommand {
    const perfil = this.perfilService.getPerfil();
    if (!perfil?.id) {
      throw new Error('No hay un usuario logueado para crear el presupuesto.');
    }
    return {
      studentId: presupuesto.alumnoId,
      creadorId: perfil.id,
      limitAmount: presupuesto.montoLimiteGeneral,
      period: presupuesto.periodo,
      startDate: presupuesto.fechaInicio,
      categoryRules: presupuesto.reglasCategoria
        .filter((r) => r.activo && r.categoriaId)
        .map((r) => ({
          categoryId: r.categoriaId,
          porcentajeLimite: r.porcentajeLimite,
        })),
    };
  }

  private mapearPresupuesto(backend: PresupuestoBackend): Presupuesto {
    const reglas: ReglaCategoria[] = (backend.reglasCategoria ?? []).map((r) => ({
      id: r.id,
      categoriaId: r.categoria.id,
      descripcionCategoria: r.categoria.descripcion,
      porcentajeLimite: r.porcentajeLimite,
      montoLimiteCalculado: r.montoLimiteCalculado,
      activo: r.activo,
    }));
    return recalcularMontosReglas({
      id: backend.id,
      alumnoId: backend.alumnoId,
      montoLimiteGeneral: backend.montoLimiteGeneral,
      periodo: backend.periodo,
      fechaInicio: backend.fechaInicio,
      activo: backend.activo,
      reglasCategoria: reglas,
    });
  }

  private mapearPrediccion(backend: PrediccionBackend): PrediccionGasto {
    return {
      alumnoId: backend.alumnoId,
      periodo: backend.periodo,
      gastoActual: backend.gastoActual,
      gastoPredicho: backend.gastoPredicho,
      promedioGastoDiario: backend.promedioGastoDiario,
      montoLimite: backend.montoLimite,
      porcentajePresupuesto: backend.porcentajePresupuesto,
      confianza: backend.confianza,
      diasRestantes: backend.diasRestantes,
      categoriasMasConsumidas: (backend.categoriasMasConsumidas ?? []).map((c) => ({
        descripcion: c.descripcion,
        montoTotal: c.montoTotal,
      })),
      resumenIa: backend.analisisIa?.resumen ?? '',
      alertas: [...(backend.analisisIa?.alertas ?? [])],
      recomendaciones: [...(backend.analisisIa?.recomendaciones ?? [])],
    };
  }

  private recuperarNoEncontrado<T>(err: unknown): Observable<T | null> {
    if (err instanceof HttpErrorResponse && err.status === 404) {
      return of(null);
    }
    throw err;
  }
}
