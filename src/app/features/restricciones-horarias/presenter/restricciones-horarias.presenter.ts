import { Injectable, computed, inject, signal } from '@angular/core';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { RestriccionesHorariasService } from '../services/restricciones-horarias.service';
import { FranjasHorariasService } from '../services/franjas-horarias.service';
import { RestriccionesNutricionalesService } from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { ProductoService } from '../../inventario/services/producto.service';
import { Alumno } from '../../../data-access/models/alumno.model';
import { RestriccionHoraria, TimeSlot } from '../models/restriccion-horaria.model';
import { CategoriaProducto } from '../../buffet/models/producto.model';
import { ClasificacionSaludBackend } from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { firstValueFrom } from 'rxjs';

export interface FranjaConRestricciones {
  franja: TimeSlot;
  restricciones: RestriccionHoraria[];
  categoriasDisponibles: CategoriaProducto[];
  saludDisponible: ClasificacionSaludBackend[];
  tieneBloqueoTotal: boolean;
}

@Injectable()
export class RestriccionesHorariasPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly restriccionesService = inject(RestriccionesHorariasService);
  private readonly franjasService = inject(FranjasHorariasService);
  private readonly nutricionalesService = inject(RestriccionesNutricionalesService);
  private readonly productService = inject(ProductoService);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly franjasState = signal<TimeSlot[]>([]);
  private readonly restriccionesState = signal<RestriccionHoraria[]>([]);
  private readonly cargandoState = signal<boolean>(false);

  private readonly catalogoSaludState = signal<ClasificacionSaludBackend[]>([]);
  private readonly saludGlobalAlumnoState = signal<ClasificacionSaludBackend[]>([]);
  private readonly categoriasState = signal<CategoriaProducto[]>([]);

  readonly alumno = this.alumnoState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly categorias = this.categoriasState.asReadonly();

  readonly catalogoSaludDisponible = computed(() => {
    const catalogo = this.catalogoSaludState();
    const globales = this.saludGlobalAlumnoState();
    return catalogo.filter(item => !globales.some(g => g.id === item.id));
  });

  readonly franjasConRestricciones = computed<FranjaConRestricciones[]>(() => {
    const franjas = this.franjasState();
    const restricciones = this.restriccionesState();

    const activas = restricciones.filter(r => r.activa !== false);

    return franjas.map(franja => {
      const deEstaFranja = activas.filter(r => {
        const idRecreo = r.franjaHoraria?.id || r.timeSlotId;
        return idRecreo === franja.id;
      });

      const categoriasDisponibles = this.categoriasState().filter(cat => 
        !deEstaFranja.some(r => r.categoria?.id === cat.id || r.categoryId === cat.id)
      );
      
      const saludGlobal = this.saludGlobalAlumnoState();
      const saludDisponible = this.catalogoSaludState().filter(salud => 
        !saludGlobal.some(g => g.id === salud.id) && 
        !deEstaFranja.some(r => r.clasificacionSalud?.id === salud.id || r.classificationId === salud.id)
      );

      const tieneBloqueoTotal = deEstaFranja.some(r => 
        !r.categoryId && !r.classificationId && !r.categoria && !r.clasificacionSalud
      );

      return {
        franja,
        restricciones: deEstaFranja,
        categoriasDisponibles,
        saludDisponible,
        tieneBloqueoTotal
      };
    });
  });

  async init(alumnoId: string): Promise<void> {
    this.cargandoState.set(true);
    try {
      await this.alumnosService.asegurarCargados();
      const alumno = this.alumnosService.getAlumnoById(alumnoId);
      this.alumnoState.set(alumno);

      if (alumno) {
        const [franjas, restricciones, catalogo, categorias, globales] = await Promise.all([
          this.franjasService.getFranjasHorarias(alumno.colegioId),
          this.restriccionesService.getRestriccionesPorAlumno(alumnoId),
          this.nutricionalesService.getCatalogo(),
          firstValueFrom(this.productService.getCategories()),
          this.nutricionalesService.getRestriccionesAlumno(alumnoId)
        ]);

        console.log('Datos cargados (RAW):', restricciones);
        this.franjasState.set(franjas);
        this.restriccionesState.set(restricciones || []);
        this.catalogoSaludState.set(catalogo);
        this.saludGlobalAlumnoState.set(globales || []);
        this.categoriasState.set(categorias.map(c => ({ id: c.id, descripcion: c.descripcion })));
      }
    } catch (error) {
      console.error('Error inicializando restricciones horarias:', error);
    } finally {
      this.cargandoState.set(false);
    }
  }

  async agregarRestriccion(franjaId: string, tipo: 'CATEGORIA' | 'SALUD' | 'TOTAL', valorId?: string | null): Promise<void> {
    const alumno = this.alumnoState();
    if (!alumno) return;

    this.cargandoState.set(true);
    try {
      await this.restriccionesService.crearRestriccion({
        studentId: alumno.id,
        timeSlotId: franjaId,
        categoryId: tipo === 'CATEGORIA' ? (valorId || null) : null,
        classificationId: tipo === 'SALUD' ? (valorId || null) : null
      });

      const actualizadas = await this.restriccionesService.getRestriccionesPorAlumno(alumno.id);
      this.restriccionesState.set(actualizadas);
    } catch (err) {
      const error = err as import('@angular/common/http').HttpErrorResponse;
      if (error.status === 409) {
        console.error('Conflicto detectado en el backend:', error.error);
        const mensajeBack = error.error?.mensaje || 'Una de las restricciones ya existe o hay un problema de integridad.';
        alert(`No se pudo guardar: ${mensajeBack}`);
      } else if (error.status === 400) {
        const mensajeBack = error.error?.message || 'Error en los datos enviados. Es posible que falten campos obligatorios.';
        alert(`No se pudo guardar: ${mensajeBack}`);
      } else {
        console.error('Error al crear restriccion horaria:', error);
        alert('Ocurrió un error inesperado al intentar guardar. Revisá los logs.');
      }
    } finally {
      this.cargandoState.set(false);
    }
  }

  getNombreCategoria(id: string): string {
    return this.categorias().find(c => c.id === id)?.descripcion ?? 'Categoría';
  }

  getNombreSalud(id: string): string {
    return this.catalogoSaludState().find(c => c.id === id)?.descripcion ?? 'Restricción';
  }

  async quitarRestriccion(id: string): Promise<void> {
    if (!confirm('¿Estás seguro de que deseas eliminar esta restricción?')) return;

    this.cargandoState.set(true);
    try {
      await this.restriccionesService.deshabilitarRestriccion(id);
      this.restriccionesState.update(actual => actual.filter(r => r.id !== id));
      alert('Restricción eliminada con éxito.');
    } catch (error) {
      console.error('Error al eliminar restricción:', error);
      alert('No se pudo eliminar la restricción. Intentá de nuevo más tarde.');
    } finally {
      this.cargandoState.set(false);
    }
  }
}
