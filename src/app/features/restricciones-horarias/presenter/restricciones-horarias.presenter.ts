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
import { DialogService } from '../../../shared/services/dialog.service';

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
  private readonly dialogService = inject(DialogService);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly franjasState = signal<TimeSlot[]>([]);
  private readonly restriccionesState = signal<RestriccionHoraria[]>([]);
  private readonly draftRestricciones = signal<RestriccionHoraria[]>([]);
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
    const restricciones = this.draftRestricciones();

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

        this.franjasState.set(franjas);
        this.restriccionesState.set(restricciones || []);
        this.draftRestricciones.set(JSON.parse(JSON.stringify(restricciones || [])));
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

  agregarRestriccion(franjaId: string, tipo: 'CATEGORIA' | 'SALUD' | 'TOTAL', valorId?: string | null): void {
    const alumno = this.alumnoState();
    if (!alumno) return;

    const nuevaId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nueva: RestriccionHoraria = {
      id: nuevaId,
      studentId: alumno.id,
      timeSlotId: franjaId,
      categoryId: tipo === 'CATEGORIA' ? (valorId || null) : null,
      classificationId: tipo === 'SALUD' ? (valorId || null) : null,
      activa: true,
      categoria: tipo === 'CATEGORIA' && valorId ? this.categorias().find(c => c.id === valorId) : undefined,
      clasificacionSalud: tipo === 'SALUD' && valorId ? this.catalogoSaludState().find(s => s.id === valorId) : undefined
    };

    this.draftRestricciones.update(actual => [...actual, nueva]);
  }

  getNombreCategoria(id: string): string {
    return this.categorias().find(c => c.id === id)?.descripcion ?? 'Categoría';
  }

  getNombreSalud(id: string): string {
    return this.catalogoSaludState().find(c => c.id === id)?.descripcion ?? 'Restricción';
  }

  quitarRestriccion(id: string): void {
    this.draftRestricciones.update(actual => actual.filter(r => r.id !== id));
  }

  isManageableRestriction(r: RestriccionHoraria): boolean {
    const categories = this.categorias();
    const health = this.catalogoSaludState();

    const catBebidas = categories.find(c => c.descripcion.toLowerCase().includes('bebida') || c.descripcion.toLowerCase().includes('gaseosa'));
    const catSnacks = categories.find(c => c.descripcion.toLowerCase().includes('snack') || c.descripcion.toLowerCase().includes('papa'));
    const catGolosinas = categories.find(c => c.descripcion.toLowerCase().includes('golosina') || c.descripcion.toLowerCase().includes('dulce') || c.descripcion.toLowerCase().includes('chocolate'));

    const salTacc = health.find(s => s.descripcion.toLowerCase().includes('tacc') || s.descripcion.toLowerCase().includes('gluten'));
    const salAzucar = health.find(s => s.descripcion.toLowerCase().includes('azucar') || s.descripcion.toLowerCase().includes('diabet'));
    const salSodio = health.find(s => s.descripcion.toLowerCase().includes('sodio') || s.descripcion.toLowerCase().includes('sal'));
    const salLacteos = health.find(s => s.descripcion.toLowerCase().includes('lacteo') || s.descripcion.toLowerCase().includes('leche'));

    const manageableIds = new Set<string>();
    if (catBebidas) manageableIds.add(catBebidas.id);
    if (catSnacks) manageableIds.add(catSnacks.id);
    if (catGolosinas) manageableIds.add(catGolosinas.id);
    if (salTacc) manageableIds.add(salTacc.id);
    if (salAzucar) manageableIds.add(salAzucar.id);
    if (salSodio) manageableIds.add(salSodio.id);
    if (salLacteos) manageableIds.add(salLacteos.id);

    const valId = r.categoryId || r.classificationId || r.categoria?.id || r.clasificacionSalud?.id;
    return !!valId && manageableIds.has(valId);
  }

  async guardarCambios(): Promise<boolean> {
    const alumno = this.alumnoState();
    if (!alumno) return false;

    this.cargandoState.set(true);
    try {
      const originales = this.restriccionesState();
      const actual = this.draftRestricciones();

      // Find deleted manageable restrictions
      const eliminadas = originales.filter(orig => 
        this.isManageableRestriction(orig) && !actual.some(act => act.id === orig.id)
      );

      // Find added restrictions
      const agregadas = actual.filter(act => 
        act.id.startsWith('temp-') || !originales.some(orig => orig.id === act.id)
      );

      // Execute deletions
      for (const r of eliminadas) {
        await this.restriccionesService.deshabilitarRestriccion(r.id);
      }

      // Execute additions
      for (const r of agregadas) {
        await this.restriccionesService.crearRestriccion({
          studentId: alumno.id,
          timeSlotId: r.timeSlotId!,
          categoryId: r.categoryId,
          classificationId: r.classificationId
        });
      }

      // Reload
      const actualizadas = await this.restriccionesService.getRestriccionesPorAlumno(alumno.id);
      this.restriccionesState.set(actualizadas);
      this.draftRestricciones.set(JSON.parse(JSON.stringify(actualizadas)));

      await this.dialogService.alert('Configuración guardada con éxito.', 'Éxito');
      return true;
    } catch (error) {
      console.error('Error al guardar cambios de restricciones horarias:', error);
      await this.dialogService.alert('Ocurrió un error al intentar guardar los cambios. Intentá de nuevo más tarde.', 'Error');
      return false;
    } finally {
      this.cargandoState.set(false);
    }
  }
}
