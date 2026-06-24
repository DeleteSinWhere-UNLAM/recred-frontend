import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
import { Alumno } from '../../../data-access/models/alumno.model';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { CarritoService } from '../../compra/services/carrito.service';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { ToastService } from '../../../shared/services/toast.service';
import { BuffetService } from '../services/buffet.service';
import { FavoritosService } from '../../favoritos/services/favoritos.service';
import { PromotionService, Promotion } from '../../../data-access/services/promociones/promotion.service';
import { Buffet } from '../models/buffet.model';
import {
  CategoriaProducto,
  ClasificacionSalud,
  Producto,
} from '../models/producto.model';
import { RestriccionProductoService } from '../../restriccion-producto/services/restriccion-producto.service';
import { getPeriodRange, getProductCategory, isSameCategory } from '../../compra/utils/budget-helpers';
import { PERIODO_LABELS } from '../../presupuesto/models/presupuesto.model';
import { FranjasHorariasService } from '../../restricciones-horarias/services/franjas-horarias.service';
import { RestriccionesHorariasService } from '../../restricciones-horarias/services/restricciones-horarias.service';
import { PresupuestoService, DateBudgetStatus } from '../../presupuesto/services/presupuesto.service';
import { RestriccionesNutricionalesService, ClasificacionSaludBackend } from '../../restricciones-nutricionales/services/restricciones-nutricionales.service';
import { TimeSlot, RestriccionHoraria } from '../../restricciones-horarias/models/restriccion-horaria.model';
import { Recreo, RECREO_LABELS } from '../../compra/models/orden-compra.model';

export interface PresupuestoDisponibleCategoria {
  categoriaId: string;
  descripcionCategoria: string;
  montoLimite: number;
  montoConsumido: number;
  montoDisponible: number;
  porcentajeConsumido: number;
}

export interface PresupuestoDisponible {
  activo: boolean;
  periodo: string;
  montoLimiteGeneral: number;
  montoConsumidoGeneral: number;
  montoDisponibleGeneral: number;
  porcentajeConsumidoGeneral: number;
  reglasCategorias: PresupuestoDisponibleCategoria[];
}

export interface RecreoOpcion {
  recreo: Recreo;
  descripcion: string;
  bloqueado: boolean;
  motivo?: 'tutor' | 'tiempo';
}

export interface PresupuestoPorFecha {
  bloqueado: boolean;
  razon: string | null;
}

export interface FiltrosBuffet {
  busqueda: string;
  categoriaId: string | 'todas';
  clasificacionId: string | 'todas';
  soloFavoritos: boolean;
  precioMin: number | null;
  precioMax: number | null;
}

const filtrosPorDefecto: FiltrosBuffet = {
  busqueda: '',
  categoriaId: 'todas',
  clasificacionId: 'todas',
  soloFavoritos: false,
  precioMin: null,
  precioMax: null,
};

@Injectable()
export class BuffetPresenter {
  private readonly alumnosService = inject(AlumnosService);
  private readonly buffetService = inject(BuffetService);
  private readonly favoritosService = inject(FavoritosService);
  private readonly carritoService = inject(CarritoService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly restriccionProductoService = inject(RestriccionProductoService);
  private readonly franjasService = inject(FranjasHorariasService);
  private readonly restriccionesService = inject(RestriccionesHorariasService);
  private readonly presupuestoService = inject(PresupuestoService);
  private readonly restriccionesNutricionalesService = inject(RestriccionesNutricionalesService);
  private readonly promotionService = inject(PromotionService);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly buffetState = signal<Buffet | undefined>(undefined);
  private readonly productosState = signal<Producto[]>([]);
  private readonly favoritosState = signal<Set<string>>(new Set());
  private readonly categoriasState = signal<CategoriaProducto[]>([]);
  private readonly clasificacionesState = signal<ClasificacionSalud[]>([]);
  private readonly filtrosState = signal<FiltrosBuffet>({ ...filtrosPorDefecto });
  private readonly restriccionesNutricionalesState = signal<ClasificacionSaludBackend[]>([]);
  private readonly promocionesState = signal<Promotion[]>([]);

  private readonly franjasState = signal<TimeSlot[]>([]);
  private readonly restriccionesState = signal<RestriccionHoraria[]>([]);
  private readonly fechaSeleccionadaState = signal<string>('');
  private readonly recreoSeleccionadoState = signal<Recreo>('PRIMER_RECREO');

  private readonly presupuestoPorFechaState = signal<PresupuestoPorFecha | null>(null);
  private readonly cargandoPresupuestoPorFechaState = signal(false);

  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly buffet: Signal<Buffet | undefined> = this.buffetState.asReadonly();
  readonly productos: Signal<Producto[]> = this.productosState.asReadonly();
  readonly favoritos: Signal<Set<string>> = this.favoritosState.asReadonly();
  readonly categorias: Signal<CategoriaProducto[]> = this.categoriasState.asReadonly();
  readonly clasificaciones: Signal<ClasificacionSalud[]> =
    this.clasificacionesState.asReadonly();
  readonly filtros: Signal<FiltrosBuffet> = this.filtrosState.asReadonly();
  readonly franjas: Signal<TimeSlot[]> = this.franjasState.asReadonly();
  readonly fechaSeleccionada: Signal<string> = this.fechaSeleccionadaState.asReadonly();
  readonly recreoSeleccionado: Signal<Recreo> = this.recreoSeleccionadoState.asReadonly();
  readonly presupuestoPorFecha: Signal<PresupuestoPorFecha | null> = this.presupuestoPorFechaState.asReadonly();
  readonly cargandoPresupuestoPorFecha: Signal<boolean> = this.cargandoPresupuestoPorFechaState.asReadonly();
  readonly restriccionesNutricionales = this.restriccionesNutricionalesState.asReadonly();
  readonly promociones: Signal<Promotion[]> = this.promocionesState.asReadonly();

  readonly restriccionesHorariasInformativas = computed(() => {
    const slots = this.franjasState();
    const restricciones = this.restriccionesState();
    const generalRestrictions = restricciones.filter(
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

    return sortedSlots.map(slot => {
      const isBlocked = generalRestrictions.some(
        (r) => r.franjaHoraria?.id === slot.id || r.timeSlotId === slot.id,
      );
      return {
        descripcion: slot.descripcion,
        bloqueado: isBlocked
      };
    });
  });

  readonly tieneRestriccionesHorarias = computed(() => {
    return this.restriccionesHorariasInformativas().some((h) => h.bloqueado);
  });

  readonly nombreCompleto = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return this.usuarioService.esVistaAlumno() ? `${alumno.nombre} ${alumno.apellido}` : alumno.nombre;
  });

  readonly urlFotoPerfil = computed(() => this.alumnoState()?.urlFotoPerfil ?? null);

  readonly iniciales = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    if (this.usuarioService.esVistaAlumno()) {
      return ((alumno.nombre[0] ?? '') + (alumno.apellido[0] ?? '')).toUpperCase();
    }
    return (alumno.nombre[0] ?? '').toUpperCase();
  });

  readonly grado = computed(() => this.alumnoState()?.grado ?? '');

  readonly saldo = computed(() => this.alumnoState()?.saldo ?? 0);

  readonly itemsCarrito = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return [];
    return this.carritoService.items().filter((item) => item.alumnoId === alumno.id);
  });

  readonly totalCarrito = computed(() => {
    return this.itemsCarrito().reduce((acc, item) => acc + item.producto.precio * item.cantidad, 0);
  });

  readonly cantidadItemsCarrito = computed(() => {
    return this.itemsCarrito().reduce((acc, item) => acc + item.cantidad, 0);
  });

  readonly fechaMinima = computed<string>(() => {
    const slots = this.franjasState();
    return this.calcularFechaMinima(slots);
  });

  readonly recreosDisponibles = computed<RecreoOpcion[]>(() => {
    const slots = this.franjasState();
    const restricciones = this.restriccionesState();
    const selectedDateStr = this.fechaSeleccionadaState() || this.fechaMinima();

    const generalRestrictions = restricciones.filter(
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

    if (options.length === 0) {
      return recreosPosibles.map((rec) => ({
        recreo: rec,
        descripcion: RECREO_LABELS[rec],
        bloqueado: false,
      }));
    }

    return options;
  });

  readonly presupuestoDisponible = computed<PresupuestoDisponible | null>(() => {
    const alumno = this.alumnoState();
    if (!alumno) return null;

    const budget = this.carritoService.budgets().get(alumno.id);
    if (!budget || !budget.activo) {
      return null;
    }

    const selectedDateStr = this.fechaSeleccionadaState();
    const referenceDate = selectedDateStr ? new Date(selectedDateStr + 'T12:00:00') : new Date();
    const { start, end } = getPeriodRange(budget.periodo, referenceDate);
    const pastPurchases = this.carritoService.purchases().get(alumno.id) ?? [];
    const activeStatuses = ['APPROVED', 'PENDING', 'PENDIENTE', 'EN_PREPARACION', 'LISTO', 'ENTREGADO'];
    const approvedPastPurchases = pastPurchases.filter((m) => {
      if (!activeStatuses.includes(m.status)) return false;
      const purchaseDate = m.pickupDate ? new Date(m.pickupDate + 'T12:00:00') : new Date(m.date);
      return purchaseDate >= start && purchaseDate <= end;
    });

    let spentPastGeneral = 0;
    for (const m of approvedPastPurchases) {
      spentPastGeneral += m.totalAmount;
    }

    let spentCartGeneral = 0;
    const cartItems = this.carritoService.items().filter((i) => i.alumnoId === alumno.id);
    for (const item of cartItems) {
      spentCartGeneral += item.producto.precio * item.cantidad;
    }

    const limiteTeorico = alumno.saldo + spentPastGeneral;
    const montoLimiteGeneral = Math.min(budget.montoLimiteGeneral, limiteTeorico);
    const montoDisponibleGeneral = Math.max(
      0,
      Math.min(alumno.saldo - spentCartGeneral, budget.montoLimiteGeneral - spentPastGeneral - spentCartGeneral)
    );
    const montoConsumidoGeneral = montoLimiteGeneral - montoDisponibleGeneral;
    const porcentajeConsumidoGeneral = montoLimiteGeneral > 0
      ? Math.round((montoConsumidoGeneral / montoLimiteGeneral) * 100)
      : 0;

    const reglasCategorias: PresupuestoDisponibleCategoria[] = [];
    for (const rule of budget.reglasCategoria) {
      if (!rule.activo) continue;

      let spentPastCategory = 0;
      for (const m of approvedPastPurchases) {
        for (const item of m.items) {
          const itemCatId = getProductCategory(item.productId, item.productName, this.productosState());
          const catalogProd = this.productosState().find((p) => p.id === item.productId);
          const itemCatDesc = catalogProd?.categoria?.descripcion ?? item.productName;
          if (
            isSameCategory(
              itemCatId,
              itemCatDesc,
              rule.categoriaId,
              rule.descripcionCategoria
            )
          ) {
            spentPastCategory += item.unitPrice * item.quantity;
          }
        }
      }

      let spentCartCategory = 0;
      for (const item of cartItems) {
        if (
          isSameCategory(
            item.producto.categoria.id,
            item.producto.categoria.descripcion,
            rule.categoriaId,
            rule.descripcionCategoria
          )
        ) {
          spentCartCategory += item.producto.precio * item.cantidad;
        }
      }

      const categoryLimit = Math.min(rule.montoLimiteCalculado, montoLimiteGeneral);
      const montoConsumido = spentPastCategory + spentCartCategory;
      const montoDisponible = Math.max(0, Math.min(montoDisponibleGeneral, categoryLimit - montoConsumido));
      const porcentajeConsumido = categoryLimit > 0
        ? Math.round((montoConsumido / categoryLimit) * 100)
        : 0;

      reglasCategorias.push({
        categoriaId: rule.categoriaId,
        descripcionCategoria: rule.descripcionCategoria,
        montoLimite: categoryLimit,
        montoConsumido,
        montoDisponible,
        porcentajeConsumido,
      });
    }

    const periodoLabel = PERIODO_LABELS[budget.periodo] || budget.periodo;

    return {
      activo: true,
      periodo: periodoLabel,
      montoLimiteGeneral,
      montoConsumidoGeneral,
      montoDisponibleGeneral,
      porcentajeConsumidoGeneral,
      reglasCategorias,
    };
  });

  readonly nombreColegio = computed(() => {
    const alumno = this.alumnoState();
    if (!alumno) return '';
    return (
      this.colegiosService
        .getColegios()
        .find((c) => c.id === alumno.colegioId)?.nombre ?? ''
    );
  });

  readonly productosFiltrados = computed<Producto[]>(() => {
    const { busqueda, categoriaId, clasificacionId, soloFavoritos, precioMin, precioMax } = this.filtrosState();
    const texto = busqueda.trim().toLowerCase();
    const favs = this.favoritosState();
    const esAlumno = this.usuarioService.esVistaAlumno();

    return this.productosState().filter((producto) => {
      if (esAlumno) {
        if (producto.bloqueado) {
          return false;
        }
        if (producto.bloqueadoPorRestriccion && producto.motivoBloqueo?.toLowerCase().includes('contiene')) {
          return false;
        }
      }
      if (soloFavoritos && !favs.has(producto.id)) {
        return false;
      }
      if (texto && !producto.nombre.toLowerCase().includes(texto)) {
        return false;
      }
      if (categoriaId !== 'todas' && producto.categoria.id !== categoriaId) {
        return false;
      }
      if (
        clasificacionId !== 'todas' &&
        !producto.clasificacionesSalud.some((c) => c.id === clasificacionId)
      ) {
        return false;
      }
      if (precioMin !== null && precioMin !== undefined && producto.precio < precioMin) {
        return false;
      }
      if (precioMax !== null && precioMax !== undefined && producto.precio > precioMax) {
        return false;
      }
      return true;
    });
  });

  init(alumnoId: string): void {
    const alumno = this.alumnosService.getAlumnoById(alumnoId);
    if (!alumno) {
      this.router.navigateByUrl(this.usuarioService.homeUrl());
      return;
    }

    this.alumnoState.set(alumno);

    const savedSelection = this.carritoService.getSeleccionRetiro(alumnoId);

    this.favoritosService.getFavoritos(alumnoId).subscribe({
      next: (favs) => {
        const ids = new Set(favs.map((f) => f.id));
        this.favoritosState.set(ids);
      },
      error: (err) => {
        console.error('Error loading favorites:', err);
      }
    });

    this.restriccionesNutricionalesService.getRestriccionesAlumno(alumnoId)
      .then(res => this.restriccionesNutricionalesState.set(res))
      .catch(err => console.error('Error loading nutritional restrictions:', err));

    this.buffetService.obtenerBuffetDelAlumno(alumnoId).subscribe({
      next: (buffet) => {
        this.buffetState.set(buffet);

        this.promotionService.getPromotions(buffet.id).subscribe({
          next: (promos) => {
            this.promocionesState.set(promos);
          },
          error: (err) => {
            console.error('Error loading promotions:', err);
          }
        });

        Promise.all([
          this.franjasService.getFranjasHorarias(alumno.colegioId),
          this.restriccionesService.getRestriccionesPorAlumno(alumnoId),
        ]).then(([franjas, restricciones]) => {
          this.franjasState.set(franjas);
          this.restriccionesState.set(restricciones);

          const minDate = this.fechaMinima();
          const initialFecha = savedSelection?.fecha && savedSelection.fecha >= minDate
            ? savedSelection.fecha
            : minDate;
          const initialRecreo = savedSelection?.recreo ?? this.firstAvailableRecreo();

          this.fechaSeleccionadaState.set(initialFecha);
          this.recreoSeleccionadoState.set(initialRecreo);
          this.carritoService.setSeleccionRetiro(alumnoId, initialFecha, initialRecreo);

          const fechaHora = this.getFechaHoraConsulta(initialFecha, initialRecreo);
          this.cargarProductos(buffet.id, alumnoId, fechaHora);

          this.consultarPresupuestoPorFecha(alumnoId, initialFecha);
        }).catch((err) => {
          console.error('Error loading franjas/restricciones:', err);
          const minDate = this.calcularFechaMinima([]);
          this.fechaSeleccionadaState.set(minDate);
          this.cargarProductos(buffet.id, alumnoId);
        });
      },
      error: (err) => {
        console.error('Error loading buffet for student:', err);
        this.toastService.mostrar('No se pudo cargar el buffet del alumno', 'error');
        this.router.navigateByUrl(this.usuarioService.homeUrl());
      },
    });

    this.filtrosState.set({ ...filtrosPorDefecto });
  }

  private getFechaHoraConsulta(fecha: string, recreo: Recreo): string {
    if (!fecha) return '';
    const slot = this.franjasState().find(s => this.matchesDescription(s.descripcion, recreo));
    let hora = '10:00:00';
    if (slot && slot.horaInicio) {
      hora = slot.horaInicio;
      if (hora.split(':').length === 2) {
        hora += ':00';
      }
    }
    return `${fecha}T${hora}`;
  }

  private cargarProductos(buffetId: string, alumnoId: string, fechaHoraConsulta?: string): void {
    this.buffetService.getProductosDelBuffet(buffetId, alumnoId, fechaHoraConsulta).subscribe({
      next: (productos) => {
        this.productosState.set(productos);
        this.categoriasState.set(this.extractUniqueCategories(productos));
        this.clasificacionesState.set(this.extractUniqueClassifications(productos));
        this.carritoService.setCatalog(productos);
        this.carritoService.cargarPresupuestoYConsumo(alumnoId);
      },
      error: (err) => {
        console.error('Error loading products for buffet:', err);
      }
    });
  }

  setFecha(fecha: string): void {
    const alumno = this.alumnoState();
    if (!alumno) return;

    let adjustedFecha = fecha;
    const minDate = this.fechaMinima();
    if (fecha < minDate) {
      adjustedFecha = minDate;
    }
    if (this.esFinDeSemana(adjustedFecha)) {
      adjustedFecha = this.siguienteDiaHabil(adjustedFecha);
    }

    this.fechaSeleccionadaState.set(adjustedFecha);

    const recreoActual = this.recreoSeleccionadoState();
    const opciones = this.recreosDisponibles();
    const opcionActual = opciones.find((o) => o.recreo === recreoActual);
    if (!opcionActual || opcionActual.bloqueado) {
      const primera = opciones.find((o) => !o.bloqueado);
      if (primera) {
        this.recreoSeleccionadoState.set(primera.recreo);
      }
    }

    const recreoFinal = this.recreoSeleccionadoState();
    this.carritoService.setSeleccionRetiro(alumno.id, adjustedFecha, recreoFinal);
    this.consultarPresupuestoPorFecha(alumno.id, adjustedFecha);

    const buffet = this.buffetState();
    if (buffet) {
      const fechaHora = this.getFechaHoraConsulta(adjustedFecha, recreoFinal);
      this.cargarProductos(buffet.id, alumno.id, fechaHora);
    }
  }

  setRecreo(recreo: Recreo): void {
    const alumno = this.alumnoState();
    if (!alumno) return;

    this.recreoSeleccionadoState.set(recreo);
    const fecha = this.fechaSeleccionadaState();
    this.carritoService.setSeleccionRetiro(alumno.id, fecha, recreo);

    const buffet = this.buffetState();
    if (buffet) {
      const fechaHora = this.getFechaHoraConsulta(fecha, recreo);
      this.cargarProductos(buffet.id, alumno.id, fechaHora);
    }
  }

  private consultarPresupuestoPorFecha(alumnoId: string, fecha: string): void {
    if (!alumnoId || !fecha) return;

    this.cargandoPresupuestoPorFechaState.set(true);
    this.presupuestoService
      .checkBudgetDates(alumnoId, [fecha], [])
      .then((results: readonly DateBudgetStatus[]) => {
        const match = results.find((r) => r.date === fecha);
        this.presupuestoPorFechaState.set(
          match
            ? { bloqueado: match.blocked, razon: match.reason }
            : null
        );
      })
      .catch((err: unknown) => {
        console.error('Error consultando presupuesto por fecha:', err);
        this.presupuestoPorFechaState.set(null);
      })
      .finally(() => {
        this.cargandoPresupuestoPorFechaState.set(false);
      });
  }

  buscar(texto: string): void {
    this.filtrosState.update((actual) => ({ ...actual, busqueda: texto }));
  }

  seleccionarCategoria(categoriaId: string | 'todas'): void {
    this.filtrosState.update((actual) => ({ ...actual, categoriaId }));
  }

  seleccionarClasificacion(clasificacionId: string | 'todas'): void {
    this.filtrosState.update((actual) => ({ ...actual, clasificacionId }));
  }

  toggleSoloFavoritos(): void {
    this.filtrosState.update((actual) => ({ ...actual, soloFavoritos: !actual.soloFavoritos }));
  }

  setPrecioMin(monto: number | null): void {
    this.filtrosState.update((actual) => ({ ...actual, precioMin: monto }));
  }

  setPrecioMax(monto: number | null): void {
    this.filtrosState.update((actual) => ({ ...actual, precioMax: monto }));
  }

  limpiarFiltros(): void {
    this.filtrosState.set({ ...filtrosPorDefecto });
  }

  volver(): void {
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  irAlCarrito(): void {
    this.router.navigateByUrl('/compra');
  }

  cambiarAlumno(nuevoAlumnoId: string): void {
    if (!nuevoAlumnoId || nuevoAlumnoId === this.alumnoState()?.id) return;
    this.contextoService.setAlumnoId(nuevoAlumnoId);
    this.router.navigateByUrl('/buffet');
  }

  agregarAlCarrito(producto: Producto, cantidad = 1): void {
    const alumno = this.alumnoState();
    if (!alumno) return;
    this.carritoService.agregar(producto, alumno.id, cantidad);
    const verbo = cantidad === 1 ? 'Se agregó' : 'Se agregaron';
    this.toastService.mostrar(
      `${verbo} ${cantidad}x "${producto.nombre}" al carrito`,
    );
  }

  toggleFavorito(producto: Producto): void {
    const alumno = this.alumnoState();
    if (!alumno) return;

    const ids = new Set(this.favoritosState());
    if (ids.has(producto.id)) {
      ids.delete(producto.id);
      this.favoritosState.set(ids);
      this.favoritosService.removerFavorito(alumno.id, producto.id).subscribe({
        next: () => this.toastService.mostrar(`Se quitó "${producto.nombre}" de tus favoritos`, 'success'),
        error: (err) => console.error('Error removing favorite:', err)
      });
    } else {
      const esPlanGratuito = this.perfilService.perfil()?.plan !== 'PREMIUM';
      if (esPlanGratuito && ids.size >= 5) {
        this.toastService.mostrar('Límite de productos favoritos alcanzado para cuenta gratuita (máximo 5 por hijo).', 'error');
        return;
      }
      ids.add(producto.id);
      this.favoritosState.set(ids);
      this.favoritosService.agregarFavorito(alumno.id, producto).subscribe({
        next: () => this.toastService.mostrar(`Se agregó "${producto.nombre}" a tus favoritos`, 'success'),
        error: (err) => console.error('Error adding favorite:', err)
      });
    }
  }

  toggleLock(producto: Producto): void {
    const alumno = this.alumnoState();
    if (!alumno) return;

    const actualBloqueado = !!producto.bloqueado;
    const nuevoEstado = !actualBloqueado;

    producto.bloqueado = nuevoEstado;
    this.productosState.set(
      this.productosState().map(p => p.id === producto.id ? { ...p, bloqueado: nuevoEstado } : p)
    );

    if (actualBloqueado) {
      this.restriccionProductoService.desbloquearProducto(alumno.id, producto.id).subscribe({
        next: () => {
          this.toastService.mostrar(`Se desbloqueó "${producto.nombre}"`, 'success');
        },
        error: (err) => {
          console.error('Error unlocking product:', err);
          producto.bloqueado = true;
          this.productosState.set(
            this.productosState().map(p => p.id === producto.id ? { ...p, bloqueado: true } : p)
          );
          this.toastService.mostrar('Error al desbloquear el producto', 'error');
        }
      });
    } else {
      this.restriccionProductoService.bloquearProducto(alumno.id, producto.id).subscribe({
        next: () => {
          this.toastService.mostrar(`Se bloqueó "${producto.nombre}"`, 'success');
        },
        error: (err) => {
          console.error('Error blocking product:', err);
          producto.bloqueado = false;
          this.productosState.set(
            this.productosState().map(p => p.id === producto.id ? { ...p, bloqueado: false } : p)
          );
          this.toastService.mostrar('Error al bloquear el producto', 'error');
        }
      });
    }
  }

  private firstAvailableRecreo(): Recreo {
    const opciones = this.recreosDisponibles();
    return opciones.find((o) => !o.bloqueado)?.recreo ?? 'PRIMER_RECREO';
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

  private calcularFechaMinima(slots: TimeSlot[]): string {
    const now = new Date();
    let startFromTomorrow = false;

    if (slots.length > 0) {
      const sortedSlots = [...slots].sort((a, b) =>
        (a.horaFin || '').localeCompare(b.horaFin || '')
      );
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      if (lastSlot?.horaFin) {
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

  private esFinDeSemana(fechaStr: string): boolean {
    if (!fechaStr) return false;
    const dateObj = new Date(fechaStr + 'T00:00:00');
    const day = dateObj.getDay();
    return day === 0 || day === 6;
  }

  private siguienteDiaHabil(fechaStr: string): string {
    const dateObj = new Date(fechaStr + 'T00:00:00');
    while (true) {
      dateObj.setDate(dateObj.getDate() + 1);
      const day = dateObj.getDay();
      if (day !== 0 && day !== 6) break;
    }
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private extractUniqueCategories(productos: Producto[]): CategoriaProducto[] {
    const porId = new Map<string, CategoriaProducto>();
    for (const p of productos) {
      if (p.categoria) {
        porId.set(p.categoria.id, p.categoria);
      }
    }
    return [...porId.values()];
  }

  private extractUniqueClassifications(productos: Producto[]): ClasificacionSalud[] {
    const porId = new Map<string, ClasificacionSalud>();
    for (const p of productos) {
      if (p.clasificacionesSalud) {
        for (const c of p.clasificacionesSalud) {
          porId.set(c.id, c);
        }
      }
    }
    return [...porId.values()];
  }
}
