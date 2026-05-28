import { Injectable } from '@angular/core';
import { CategoriaProducto } from '../../buffet/models/producto.model';
import {
  PrediccionGasto,
  Presupuesto,
  presupuestoPorDefecto,
  recalcularMontosReglas,
} from '../models/presupuesto.model';

const CATEGORIAS_DISPONIBLES: CategoriaProducto[] = [
  { id: 'comidas', descripcion: 'Comidas' },
  { id: 'bebidas', descripcion: 'Bebidas' },
  { id: 'snacks', descripcion: 'Snacks' },
  { id: 'golosinas', descripcion: 'Golosinas' },
];

@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private readonly presupuestos = new Map<string, Presupuesto>([
    [
      'julian-garcia',
      recalcularMontosReglas({
        id: 'pres-julian',
        alumnoId: 'julian-garcia',
        montoLimiteGeneral: 12000,
        periodo: 'MENSUAL',
        fechaInicio: '2026-05-01',
        activo: true,
        reglasCategoria: [
          {
            id: 'r-jul-1',
            categoriaId: 'comidas',
            descripcionCategoria: 'Comidas',
            porcentajeLimite: 50,
            montoLimiteCalculado: 0,
            activo: true,
          },
          {
            id: 'r-jul-2',
            categoriaId: 'bebidas',
            descripcionCategoria: 'Bebidas',
            porcentajeLimite: 20,
            montoLimiteCalculado: 0,
            activo: true,
          },
          {
            id: 'r-jul-3',
            categoriaId: 'snacks',
            descripcionCategoria: 'Snacks',
            porcentajeLimite: 20,
            montoLimiteCalculado: 0,
            activo: true,
          },
        ],
      }),
    ],
    [
      'sofia-garcia',
      recalcularMontosReglas({
        id: 'pres-sofia',
        alumnoId: 'sofia-garcia',
        montoLimiteGeneral: 6000,
        periodo: 'SEMANAL',
        fechaInicio: '2026-05-25',
        activo: true,
        reglasCategoria: [
          {
            id: 'r-sof-1',
            categoriaId: 'comidas',
            descripcionCategoria: 'Comidas',
            porcentajeLimite: 40,
            montoLimiteCalculado: 0,
            activo: true,
          },
          {
            id: 'r-sof-2',
            categoriaId: 'golosinas',
            descripcionCategoria: 'Golosinas',
            porcentajeLimite: 10,
            montoLimiteCalculado: 0,
            activo: true,
          },
        ],
      }),
    ],
    [
      'mateo-garcia',
      recalcularMontosReglas({
        id: 'pres-mateo',
        alumnoId: 'mateo-garcia',
        montoLimiteGeneral: 4000,
        periodo: 'SEMANAL',
        fechaInicio: '2026-05-25',
        activo: true,
        reglasCategoria: [
          {
            id: 'r-mat-1',
            categoriaId: 'comidas',
            descripcionCategoria: 'Comidas',
            porcentajeLimite: 60,
            montoLimiteCalculado: 0,
            activo: true,
          },
          {
            id: 'r-mat-2',
            categoriaId: 'bebidas',
            descripcionCategoria: 'Bebidas',
            porcentajeLimite: 30,
            montoLimiteCalculado: 0,
            activo: true,
          },
        ],
      }),
    ],
  ]);

  private readonly predicciones = new Map<string, PrediccionGasto>([
    [
      'julian-garcia',
      {
        alumnoId: 'julian-garcia',
        periodo: 'MENSUAL',
        gastoActual: 3850,
        gastoPredicho: 9200,
        promedioGastoDiario: 340,
        montoLimite: 12000,
        porcentajePresupuesto: 76.7,
        confianza: 0.82,
        diasRestantes: 14,
        categoriasMasConsumidas: [
          { descripcion: 'Comidas', montoTotal: 2200 },
          { descripcion: 'Bebidas', montoTotal: 950 },
          { descripcion: 'Snacks', montoTotal: 700 },
        ],
        resumenIa:
          'Julián viene consumiendo a un ritmo estable. Si mantiene el promedio, va a llegar al fin de mes cerca del límite pero sin pasarse.',
        alertas: [
          'En los últimos 5 días aumentó el gasto en Comidas un 18%.',
        ],
        recomendaciones: [
          'Considerá bajar el porcentaje destinado a Snacks 5 puntos.',
          'Sugerí a Julián elegir agua en lugar de jugos para estirar el límite de Bebidas.',
        ],
      },
    ],
    [
      'sofia-garcia',
      {
        alumnoId: 'sofia-garcia',
        periodo: 'SEMANAL',
        gastoActual: 1100,
        gastoPredicho: 2800,
        promedioGastoDiario: 220,
        montoLimite: 6000,
        porcentajePresupuesto: 46.7,
        confianza: 0.65,
        diasRestantes: 3,
        categoriasMasConsumidas: [
          { descripcion: 'Comidas', montoTotal: 750 },
          { descripcion: 'Golosinas', montoTotal: 350 },
        ],
        resumenIa:
          'Sofía está consumiendo muy por debajo de su límite semanal. Hay margen para flexibilizar las reglas si lo deseás.',
        alertas: [],
        recomendaciones: [
          'Podrías subir el límite de Golosinas 5 puntos sin riesgo de excederte.',
        ],
      },
    ],
    [
      'mateo-garcia',
      {
        alumnoId: 'mateo-garcia',
        periodo: 'SEMANAL',
        gastoActual: 3600,
        gastoPredicho: 4900,
        promedioGastoDiario: 720,
        montoLimite: 4000,
        porcentajePresupuesto: 122.5,
        confianza: 0.91,
        diasRestantes: 2,
        categoriasMasConsumidas: [
          { descripcion: 'Comidas', montoTotal: 2400 },
          { descripcion: 'Bebidas', montoTotal: 900 },
          { descripcion: 'Snacks', montoTotal: 300 },
        ],
        resumenIa:
          'Mateo va a exceder el presupuesto semanal. Su consumo de Comidas está muy por encima del promedio.',
        alertas: [
          'Proyectamos un exceso de $900 sobre el límite semanal.',
          'El consumo de Comidas ya superó el 80% del cupo de la categoría.',
        ],
        recomendaciones: [
          'Aumentar el límite general a $5.500 cubriría la proyección.',
          'Revisá los hábitos de los últimos días con Mateo para entender el aumento.',
        ],
      },
    ],
  ]);

  getPresupuesto(alumnoId: string): Presupuesto {
    return this.presupuestos.get(alumnoId) ?? presupuestoPorDefecto(alumnoId);
  }

  getPrediccion(alumnoId: string): PrediccionGasto | undefined {
    return this.predicciones.get(alumnoId);
  }

  getCategoriasDisponibles(): CategoriaProducto[] {
    return CATEGORIAS_DISPONIBLES;
  }

  guardar(presupuesto: Presupuesto): void {
    const normalizado = recalcularMontosReglas({ ...presupuesto, activo: true });
    this.presupuestos.set(presupuesto.alumnoId, normalizado);
    console.info('[PresupuestoService] guardado', normalizado);
  }

  desactivar(alumnoId: string): void {
    const actual = this.presupuestos.get(alumnoId);
    if (!actual) return;
    this.presupuestos.set(alumnoId, { ...actual, activo: false });
    console.info('[PresupuestoService] desactivado', alumnoId);
  }
}
