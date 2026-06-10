import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { ItemCarrito } from '../../models/carrito.model';
import {
  OrdenAlumno,
  Recreo,
} from '../../models/orden-compra.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { CarritoService } from '../../services/carrito.service';
import { CompraService } from '../../services/compra.service';
import { RestriccionesHorariasService } from '../../../restricciones-horarias/services/restricciones-horarias.service';
import { FranjasHorariasService } from '../../../restricciones-horarias/services/franjas-horarias.service';

export interface GrupoCarrito {
  alumno: Alumno;
  items: ItemCarrito[];
  subtotal: number;
  seleccionado: boolean;
  fecha: string;
  recreo: Recreo;
}

export interface RecreoOpcion {
  recreo: Recreo;
  descripcion: string;
  bloqueado: boolean;
}

@Injectable()
export class CarritoPresenter {
  private readonly carritoService = inject(CarritoService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly compraService = inject(CompraService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly restriccionesService = inject(RestriccionesHorariasService);
  private readonly franjasService = inject(FranjasHorariasService);

  private readonly seleccionState = signal<Record<string, boolean>>({});
  private readonly fechasState = signal<Record<string, string>>({});
  private readonly recreosState = signal<Record<string, Recreo>>({});
  private readonly blockedRecreosState = signal<Record<string, Recreo[]>>({});
  private readonly recreosDisponiblesState = signal<Record<string, RecreoOpcion[]>>({});

  readonly blockedRecreos = this.blockedRecreosState.asReadonly();
  readonly recreosDisponiblesMap = this.recreosDisponiblesState.asReadonly();

  readonly fechaMinima = this.calcularFechaMinima();

  readonly grupos: Signal<GrupoCarrito[]> = computed(() => {
    const mapa = this.carritoService.itemsPorAlumno();
    const seleccion = this.seleccionState();
    const fechas = this.fechasState();
    const recreos = this.recreosState();

    const lista: GrupoCarrito[] = [];
    for (const [alumnoId, items] of mapa) {
      const alumno = this.alumnosService.getAlumnoById(alumnoId);
      if (!alumno) continue;
      const subtotal = items.reduce(
        (acc, i) => acc + i.producto.precio * i.cantidad,
        0,
      );
      lista.push({
        alumno,
        items,
        subtotal,
        seleccionado: seleccion[alumnoId] ?? true,
        fecha: fechas[alumnoId] ?? this.fechaMinima,
        recreo: recreos[alumnoId] ?? 'PRIMER_RECREO',
      });
    }
    return lista;
  });

  readonly carritoVacio = computed(() => this.grupos().length === 0);

  readonly totalSeleccionado = computed(() =>
    this.grupos()
      .filter((g) => g.seleccionado)
      .reduce((acc, g) => acc + g.subtotal, 0),
  );

  readonly haySeleccion = computed(() =>
    this.grupos().some((g) => g.seleccionado),
  );

  readonly hayFechaFaltante = computed(() =>
    this.grupos().some((g) => g.seleccionado && !g.fecha),
  );

  readonly hayRecreoBloqueadoSeleccionado = computed(() => {
    const blocked = this.blockedRecreos();
    return this.grupos().some(g => {
      if (!g.seleccionado) return false;
      const blockedList = blocked[g.alumno.id] || [];
      return blockedList.includes(g.recreo);
    });
  });

  readonly avanzarPosible = computed(
    () => this.haySeleccion() && !this.hayFechaFaltante() && !this.hayRecreoBloqueadoSeleccionado(),
  );

  readonly advertencia = computed<string | null>(() => {
    const conDeuda = this.grupos().filter(
      (g) => g.seleccionado && g.alumno.saldo < g.subtotal,
    );
    if (conDeuda.length > 0) {
      if (conDeuda.length === 1) {
        return `El saldo de ${conDeuda[0].alumno.nombre} no alcanza para este pedido.`;
      }
      return `Hay ${conDeuda.length} alumnos con saldo insuficiente.`;
    }

    const conRecreoBloqueado = this.grupos().filter(
      g => g.seleccionado && (this.blockedRecreos()[g.alumno.id] || []).includes(g.recreo)
    );
    if (conRecreoBloqueado.length > 0) {
      if (conRecreoBloqueado.length === 1) {
        return `${conRecreoBloqueado[0].alumno.nombre} tiene bloqueadas todas las compras en el recreo seleccionado.`;
      }
      return `Hay alumnos con el recreo seleccionado bloqueado por el tutor.`;
    }

    return null;
  });

  toggleSeleccion(alumnoId: string): void {
    this.seleccionState.update((actual) => ({
      ...actual,
      [alumnoId]: !(actual[alumnoId] ?? true),
    }));
  }

  setFecha(alumnoId: string, fecha: string): void {
    this.fechasState.update((actual) => ({ ...actual, [alumnoId]: fecha }));
  }

  setRecreo(alumnoId: string, recreo: Recreo): void {
    this.recreosState.update((actual) => ({ ...actual, [alumnoId]: recreo }));
  }

  sumarItem(itemId: string): void {
    this.carritoService.cambiarCantidad(itemId, 1);
  }

  restarItem(itemId: string): void {
    this.carritoService.cambiarCantidad(itemId, -1);
  }

  eliminarItem(itemId: string): void {
    this.carritoService.quitar(itemId);
  }

  avanzar(): void {
    if (!this.avanzarPosible()) return;
    const ordenes: OrdenAlumno[] = this.grupos()
      .filter((g) => g.seleccionado)
      .map((g) => ({
        alumno: g.alumno,
        items: g.items,
        fecha: g.fecha,
        recreo: g.recreo,
        subtotal: g.subtotal,
      }));
    this.compraService.iniciarOrden(ordenes);
    this.router.navigateByUrl('/compra/confirmar');
  }

  volverAlBuffet(): void {
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  private calcularFechaMinima(): string {
    // TODO: validar feriados/fines de semana cuando exista endpoint
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async init(): Promise<void> {
    await this.alumnosService.asegurarCargados();
    const mapa = this.carritoService.itemsPorAlumno();
    const studentIds = Array.from(mapa.keys());
    
    const disponiblesMap: Record<string, RecreoOpcion[]> = {};
    const blockedMap: Record<string, Recreo[]> = {};
    
    await Promise.all(
      studentIds.map(async (alumnoId) => {
        const alumno = this.alumnosService.getAlumnoById(alumnoId);
        if (!alumno) return;
        
        try {
          const [restricciones, franjas] = await Promise.all([
            this.restriccionesService.getRestriccionesPorAlumno(alumnoId),
            this.franjasService.getFranjasHorarias(alumno.colegioId)
          ]);
          
          const generalRestrictions = restricciones.filter(
            r => r.activa !== false && !r.categoryId && !r.classificationId && !r.categoria && !r.clasificacionSalud
          );
          
          const sortedSlots = [...franjas].sort((a, b) => (a.horaInicio || '').localeCompare(b.horaInicio || ''));
          
          const options: RecreoOpcion[] = [];
          const blockedList: Recreo[] = [];
          const recreosPosibles: Recreo[] = ['PRIMER_RECREO', 'SEGUNDO_RECREO', 'MEDIODIA', 'FUERA_HORA'];
          
          for (const slot of sortedSlots) {
            let matchedRecreo: Recreo | undefined;
            for (const rec of recreosPosibles) {
              if (this.matchesDescription(slot.descripcion, rec)) {
                matchedRecreo = rec;
                break;
              }
            }
            
            if (!matchedRecreo) {
              const idx = sortedSlots.indexOf(slot);
              if (idx >= 0 && idx < recreosPosibles.length) {
                matchedRecreo = recreosPosibles[idx];
              }
            }
            
            if (matchedRecreo) {
              const isBlocked = generalRestrictions.some(r => 
                r.franjaHoraria?.id === slot.id || r.timeSlotId === slot.id
              );
              
              if (isBlocked) {
                blockedList.push(matchedRecreo);
              }
              
              if (!options.some(o => o.recreo === matchedRecreo)) {
                options.push({
                  recreo: matchedRecreo,
                  descripcion: slot.descripcion,
                  bloqueado: isBlocked
                });
              }
            }
          }
          
          disponiblesMap[alumnoId] = options;
          blockedMap[alumnoId] = blockedList;
        } catch (error) {
          console.error(`Error al cargar recreos para el alumno ${alumnoId}:`, error);
        }
      })
    );
    
    this.recreosDisponiblesState.set(disponiblesMap);
    this.blockedRecreosState.set(blockedMap);
    this.ajustarRecreosSeleccionados(blockedMap, disponiblesMap);
  }

  private matchesDescription(slotDescripcion: string, recreo: Recreo): boolean {
    if (!slotDescripcion) return false;
    const desc = slotDescripcion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    switch (recreo) {
      case 'PRIMER_RECREO':
        return desc.includes('primer') && desc.includes('recreo');
      case 'SEGUNDO_RECREO':
        return desc.includes('segundo') && desc.includes('recreo');
      case 'MEDIODIA':
        return desc.includes('mediodia') || desc.includes('medio dia') || desc.includes('almuerzo');
      case 'FUERA_HORA':
        return desc.includes('salida') || desc.includes('despues') || desc.includes('final');
      default:
        return false;
    }
  }

  private ajustarRecreosSeleccionados(
    blockedMap: Record<string, Recreo[]>, 
    disponiblesMap: Record<string, RecreoOpcion[]>
  ): void {
    const actualRecreos = { ...this.recreosState() };
    let changed = false;
    
    for (const [alumnoId, options] of Object.entries(disponiblesMap)) {
      const current = actualRecreos[alumnoId];
      const blocked = blockedMap[alumnoId] || [];
      
      const currentIsValid = current && options.some(o => o.recreo === current) && !blocked.includes(current);
      if (!currentIsValid) {
        const disponible = options.find(o => !o.bloqueado);
        if (disponible) {
          actualRecreos[alumnoId] = disponible.recreo;
          changed = true;
        } else if (options.length > 0) {
          actualRecreos[alumnoId] = options[0].recreo;
          changed = true;
        }
      }
    }
    
    if (changed) {
      this.recreosState.set(actualRecreos);
    }
  }
}
