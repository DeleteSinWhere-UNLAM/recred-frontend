import { Injectable, Signal, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { of, tap } from 'rxjs';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { ItemCarrito } from '../../models/carrito.model';
import { SugerenciaCarrito } from '../../models/sugerencia-carrito.model';
import {
  OrdenAlumno,
  Recreo,
} from '../../models/orden-compra.model';
import { AlumnosService } from '../../../../data-access/services/alumnos.service';
import { UsuarioService } from '../../../../data-access/services/usuario.service';
import { BuffetService } from '../../../buffet/services/buffet.service';
import { SugerenciasCarritoService } from '../../services/sugerencias-carrito.service';
import { CarritoService } from '../../services/carrito.service';
import { CompraService } from '../../services/compra.service';
import { RestriccionesHorariasService } from '../../../restricciones-horarias/services/restricciones-horarias.service';
import { FranjasHorariasService } from '../../../restricciones-horarias/services/franjas-horarias.service';
import { firstValueFrom } from 'rxjs';
import { RestriccionHoraria, TimeSlot } from '../../../restricciones-horarias/models/restriccion-horaria.model';
import { Buffet } from '../../../buffet/models/buffet.model';
import { Producto } from '../../../buffet/models/producto.model';
import { ToastService } from '../../../../shared/services/toast.service';

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
  motivo?: 'tutor' | 'tiempo';
}

@Injectable()
export class CarritoPresenter {
  private readonly carritoService = inject(CarritoService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly compraService = inject(CompraService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly buffetService = inject(BuffetService);
  private readonly sugerenciasCarritoService = inject(SugerenciasCarritoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly restriccionesService = inject(RestriccionesHorariasService);
  private readonly franjasService = inject(FranjasHorariasService);

  private readonly seleccionState = signal<Record<string, boolean>>({});
  private readonly fechasState = signal<Record<string, string>>({});
  private readonly recreosState = signal<Record<string, Recreo>>({});
  private readonly franjasMap = signal<Record<string, TimeSlot[]>>({});
  private readonly restriccionesMap = signal<Record<string, RestriccionHoraria[]>>({});

  readonly recreosDisponiblesMap = computed(() => {
    const dates = this.fechasState();
    const franjas = this.franjasMap();
    const restricciones = this.restriccionesMap();
    const result: Record<string, RecreoOpcion[]> = {};

    const itemsPorAlumno = this.carritoService.itemsPorAlumno();
    for (const alumnoId of itemsPorAlumno.keys()) {
      const slots = franjas[alumnoId] || [];
      const studentRestrictions = restricciones[alumnoId] || [];
      const selectedDateStr = dates[alumnoId] || this.fechaMinima;

      const generalRestrictions = studentRestrictions.filter(
        (r) =>
          r.activa !== false &&
          !r.categoryId &&
          !r.classificationId &&
          !r.categoria &&
          !r.clasificacionSalud,
      );

      const sortedSlots = [...slots].sort((a, b) =>
        (a.horaInicio || '').localeCompare(b.horaInicio || ''),
      );
      const options: RecreoOpcion[] = [];
      const recreosPosibles: Recreo[] = [
        'PRIMER_RECREO',
        'SEGUNDO_RECREO',
        'MEDIODIA',
        'FUERA_HORA',
      ];

      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

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
          let isBlocked = generalRestrictions.some(
            (r) => r.franjaHoraria?.id === slot.id || r.timeSlotId === slot.id,
          );
          let motivo: 'tutor' | 'tiempo' = 'tutor';

          if (selectedDateStr === todayStr && slot.horaInicio) {
            const [hours, minutes] = slot.horaInicio.split(':').map(Number);
            const slotTime = new Date(now);
            slotTime.setHours(hours, minutes, 0, 0);

            const diffMs = slotTime.getTime() - now.getTime();
            if (diffMs <= 3600000) {
              isBlocked = true;
              motivo = 'tiempo';
            }
          }

          if (!options.some((o) => o.recreo === matchedRecreo)) {
            options.push({
              recreo: matchedRecreo,
              descripcion: slot.descripcion,
              bloqueado: isBlocked,
              motivo: isBlocked ? motivo : undefined,
            });
          }
        }
      }
      result[alumnoId] = options;
    }
    return result;
  });

  readonly blockedRecreos = computed(() => {
    const disponiblesMap = this.recreosDisponiblesMap();
    const result: Record<string, Recreo[]> = {};
    for (const [alumnoId, options] of Object.entries(disponiblesMap)) {
      result[alumnoId] = options
        .filter((o) => o.bloqueado)
        .map((o) => o.recreo);
    }
    return result;
  });

  private readonly sugerenciasState = signal<SugerenciaCarrito[]>([]);
  private readonly cargandoSugerenciasState = signal(false);
  private readonly buffetCache = new Map<string, Buffet>();

  readonly sugerencias: Signal<SugerenciaCarrito[]> = this.sugerenciasState.asReadonly();
  readonly cargandoSugerencias: Signal<boolean> = this.cargandoSugerenciasState.asReadonly();
  readonly mostrarSugerencias = computed(
    () =>
      this.perfilService.rol() === 'ALUMNO' || this.usuarioService.esVistaAlumno(),
  );

  readonly fechaMinima = this.calcularFechaMinima();

  readonly fechaMinimaMap = computed(() => {
    const franjas = this.franjasMap();
    const result: Record<string, string> = {};
    const itemsPorAlumno = this.carritoService.itemsPorAlumno();

    for (const alumnoId of itemsPorAlumno.keys()) {
      const slots = franjas[alumnoId] || [];
      result[alumnoId] = this.calcularFechaMinimaParaAlumno(slots);
    }
    return result;
  });

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
        fecha: fechas[alumnoId] ?? (this.fechaMinimaMap()[alumnoId] || this.fechaMinima),
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

  readonly avanzarPosible = computed(() => {
    if (
      !this.haySeleccion() ||
      this.hayFechaFaltante() ||
      this.hayRecreoBloqueadoSeleccionado()
    ) {
      return false;
    }
    const disponiblesMap = this.recreosDisponiblesMap();
    for (const g of this.grupos()) {
      if (g.seleccionado) {
        const studentMin = this.fechaMinimaMap()[g.alumno.id] || this.fechaMinima;
        if (g.fecha < studentMin || this.esFinDeSemana(g.fecha)) {
          return false;
        }
        const options = disponiblesMap[g.alumno.id] || [];
        const selectedOption = options.find((o) => o.recreo === g.recreo);
        if (!selectedOption || selectedOption.bloqueado) {
          return false;
        }
      }
    }
    return true;
  });

  readonly advertencia = computed<string | null>(() => {
    const conFechaInvalida = this.grupos().filter((g) => {
      if (!g.seleccionado || !g.fecha) return false;
      const studentMin = this.fechaMinimaMap()[g.alumno.id] || this.fechaMinima;
      return g.fecha < studentMin || this.esFinDeSemana(g.fecha);
    });

    if (conFechaInvalida.length > 0) {
      const g = conFechaInvalida[0];
      const isWeekend = this.esFinDeSemana(g.fecha);
      if (conFechaInvalida.length === 1) {
        if (isWeekend) {
          return `La fecha seleccionada para ${g.alumno.nombre} corresponde a un fin de semana.`;
        }
        return `La fecha seleccionada para ${g.alumno.nombre} no está permitida o es anterior a la fecha actual.`;
      }
      return `Hay alumnos con fechas seleccionadas inválidas (anteriores a la actual o fin de semana).`;
    }

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
      (g) =>
        g.seleccionado &&
        (this.blockedRecreos()[g.alumno.id] || []).includes(g.recreo),
    );
    if (conRecreoBloqueado.length > 0) {
      const alumnoId = conRecreoBloqueado[0].alumno.id;
      const options = this.recreosDisponiblesMap()[alumnoId] || [];
      const selectedOption = options.find(
        (o) => o.recreo === conRecreoBloqueado[0].recreo,
      );

      if (selectedOption?.motivo === 'tiempo') {
        if (conRecreoBloqueado.length === 1) {
          return `Falta una hora o menos para el recreo seleccionado de ${conRecreoBloqueado[0].alumno.nombre}.`;
        }
        return `Hay recreos seleccionados para los cuales falta una hora o menos.`;
      }

      if (conRecreoBloqueado.length === 1) {
        return `${conRecreoBloqueado[0].alumno.nombre} tiene bloqueadas todas las compras en el recreo seleccionado.`;
      }
      return `Hay alumnos con el recreo seleccionado bloqueado por el tutor.`;
    }

    return null;
  });

  constructor() {
    effect(() => {
      if (!this.mostrarSugerencias()) {
        this.sugerenciasState.set([]);
        return;
      }
      this.refrescarSugerencias();
    });
  }

  private refrescarSugerencias(): void {
    const grupo = this.grupos()[0];
    if (!grupo) {
      this.sugerenciasState.set([]);
      return;
    }
    const studentId = this.perfilService.obtenerAlumnoId() ?? grupo.alumno.id;
    if (!studentId) {
      this.sugerenciasState.set([]);
      return;
    }

    const itemsRequest = grupo.items.map((i) => ({
      productId: i.producto.id,
      quantity: i.cantidad,
    }));

    this.resolverBuffet(studentId).subscribe({
      next: (buffet) => {
        this.cargandoSugerenciasState.set(true);
        this.sugerenciasCarritoService
          .obtenerSugerencias({
            studentId,
            buffetId: buffet.id,
            items: itemsRequest,
            limit: 3,
          })
          .subscribe({
            next: (resultado) => {
              this.sugerenciasState.set(resultado);
              this.cargandoSugerenciasState.set(false);
            },
            error: (err) => {
              console.error('Error al obtener sugerencias de carrito:', err);
              this.sugerenciasState.set([]);
              this.cargandoSugerenciasState.set(false);
            },
          });
      },
      error: (err) => {
        console.error('Error al resolver buffet del alumno:', err);
        this.sugerenciasState.set([]);
        this.cargandoSugerenciasState.set(false);
      },
    });
  }

  private resolverBuffet(alumnoId: string) {
    const cacheado = this.buffetCache.get(alumnoId);
    if (cacheado) {
      return of(cacheado);
    }
    return this.buffetService.obtenerBuffetDelAlumno(alumnoId).pipe(
      tap((buffet) => this.buffetCache.set(alumnoId, buffet)),
    );
  }

  agregarSugerencia(sugerencia: SugerenciaCarrito): void {
    const grupo = this.grupos()[0];
    if (!grupo) return;
    const producto: Producto = {
      id: sugerencia.productId,
      nombre: sugerencia.productName,
      descripcion: '',
      precio: sugerencia.price,
      categoria: { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: [],
      imagen: '',
      estadoStock: sugerencia.stockActual > 0 ? 'DISPONIBLE' : 'SIN_STOCK',
    };
    this.carritoService.agregar(producto, grupo.alumno.id, 1);
    this.toastService.mostrar(
      `Se agregó "${producto.nombre}" al carrito`,
    );
  }

  toggleSeleccion(alumnoId: string): void {
    this.seleccionState.update((actual) => ({
      ...actual,
      [alumnoId]: !(actual[alumnoId] ?? true),
    }));
  }

  setFecha(alumnoId: string, fecha: string): void {
    const minDate = this.fechaMinimaMap()[alumnoId] || this.fechaMinima;
    let adjustedFecha = fecha;
    if (fecha < minDate) {
      adjustedFecha = minDate;
    }
    if (this.esFinDeSemana(adjustedFecha)) {
      adjustedFecha = this.siguienteDiaHabilDesdeString(adjustedFecha);
    }
    this.fechasState.update((actual) => ({ ...actual, [alumnoId]: adjustedFecha }));
    setTimeout(() => {
      this.ajustarRecreosSeleccionados(
        this.blockedRecreos(),
        this.recreosDisponiblesMap(),
      );
    });
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
    const candidate = new Date();
    while (true) {
      const day = candidate.getDay();
      if (day === 0 || day === 6) {
        candidate.setDate(candidate.getDate() + 1);
      } else {
        break;
      }
    }
    const yyyy = candidate.getFullYear();
    const mm = String(candidate.getMonth() + 1).padStart(2, '0');
    const dd = String(candidate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  async init(): Promise<void> {
    await this.alumnosService.asegurarCargados();
    const mapa = this.carritoService.itemsPorAlumno();
    const studentIds = Array.from(mapa.keys());
    
    const franjasRecord: Record<string, TimeSlot[]> = {};
    const restriccionesRecord: Record<string, RestriccionHoraria[]> = {};

    await Promise.all(
      studentIds.map(async (alumnoId) => {
        const alumno = this.alumnosService.getAlumnoById(alumnoId);
        if (!alumno) return;

        try {
          const buffet = this.buffetService.getBuffetDelAlumno(
            alumno.colegioId,
          );
          if (buffet) {
            const products = await firstValueFrom(
              this.buffetService.getProductosDelBuffet(buffet.id, alumnoId),
            );
            this.carritoService.setCatalog(products);
          }
          await this.carritoService.cargarPresupuestoYConsumo(alumnoId);
        } catch (error) {
          console.error(
            `Error loading catalog/budget for student ${alumnoId}:`,
            error,
          );
        }

        try {
          const [restricciones, franjas] = await Promise.all([
            this.restriccionesService.getRestriccionesPorAlumno(alumnoId),
            this.franjasService.getFranjasHorarias(alumno.colegioId),
          ]);

          franjasRecord[alumnoId] = franjas;
          restriccionesRecord[alumnoId] = restricciones;
        } catch (error) {
          console.error(
            `Error al cargar recreos para el alumno ${alumnoId}:`,
            error,
          );
        }
      }),
    );

    this.franjasMap.set(franjasRecord);
    this.restriccionesMap.set(restriccionesRecord);

    this.ajustarFechasIniciales();
    this.ajustarRecreosSeleccionados(
      this.blockedRecreos(),
      this.recreosDisponiblesMap(),
    );
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

  private calcularFechaMinimaParaAlumno(slots: TimeSlot[]): string {
    const now = new Date();
    let startFromTomorrow = false;
    
    if (slots.length > 0) {
      const sortedSlots = [...slots].sort((a, b) =>
        (a.horaFin || '').localeCompare(b.horaFin || '')
      );
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      if (lastSlot && lastSlot.horaFin) {
        const [hours, minutes] = lastSlot.horaFin.split(':').map(Number);
        const slotEndTime = new Date(now);
        slotEndTime.setHours(hours, minutes, 0, 0);
        
        if (now.getTime() >= slotEndTime.getTime()) {
          startFromTomorrow = true;
        }
      }
    }
    
    const candidate = new Date(now);
    if (startFromTomorrow) {
      candidate.setDate(candidate.getDate() + 1);
    }
    
    while (true) {
      const day = candidate.getDay();
      if (day === 0 || day === 6) {
        candidate.setDate(candidate.getDate() + 1);
      } else {
        break;
      }
    }
    
    const yyyy = candidate.getFullYear();
    const mm = String(candidate.getMonth() + 1).padStart(2, '0');
    const dd = String(candidate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private ajustarFechasIniciales(): void {
    const actualFechas = { ...this.fechasState() };
    const minMap = this.fechaMinimaMap();
    let changed = false;

    for (const [alumnoId, minDate] of Object.entries(minMap)) {
      const current = actualFechas[alumnoId];
      if (!current || current < minDate || this.esFinDeSemana(current)) {
        actualFechas[alumnoId] = minDate;
        changed = true;
      }
    }

    if (changed) {
      this.fechasState.set(actualFechas);
    }
  }

  private esFinDeSemana(fechaStr: string): boolean {
    if (!fechaStr) return false;
    const dateObj = new Date(fechaStr + 'T00:00:00');
    const day = dateObj.getDay();
    return day === 0 || day === 6;
  }

  private siguienteDiaHabilDesdeString(fechaStr: string): string {
    const dateObj = new Date(fechaStr + 'T00:00:00');
    while (true) {
      dateObj.setDate(dateObj.getDate() + 1);
      const day = dateObj.getDay();
      if (day !== 0 && day !== 6) {
        break;
      }
    }
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
