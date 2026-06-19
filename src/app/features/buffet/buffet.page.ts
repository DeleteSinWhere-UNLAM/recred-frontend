import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { ProductoCardComponent } from './components/producto-card/producto-card.component';
import { SeleccionarAlumnoModalComponent } from './components/seleccionar-alumno-modal/seleccionar-alumno-modal.component';
import { BuffetPresenter } from './presenter/buffet.presenter';
import { Recreo } from '../compra/models/orden-compra.model';
import { Producto } from './models/producto.model';
import { CarritoService } from '../compra/services/carrito.service';

export interface DateCell {
  date: Date;
  fechaStr: string;
  nroDia: number;
  fueraDeMes: boolean;
  esFinDeSemana: boolean;
  bloqueado: boolean;
  seleccionada: boolean;
}

@Component({
  selector: 'app-buffet-page',
  templateUrl: './buffet.page.html',
  styleUrl: './buffet.page.css',
  imports: [NavbarComponent, ProductoCardComponent, SeleccionarAlumnoModalComponent],
  providers: [BuffetPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuffetPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly carritoService = inject(CarritoService);
  protected readonly presenter = inject(BuffetPresenter);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;
  readonly todosLosAlumnos = this.alumnosService.alumnos;
  readonly todosLosColegios = this.colegiosService.getColegios();

  protected readonly mostrarSelector = signal(false);
  protected readonly panelLateralCerrado = signal<boolean>(false);
  protected readonly diasCalendario = signal<DateCell[]>([]);

  // Carrusel de Promociones
  @ViewChild('promosContainer') promosContainer!: ElementRef<HTMLDivElement>;
  protected readonly activeSlideIndex = signal(0);

  // Mapeo dinámico y estático de promociones
  protected esPromocion(producto: Producto): boolean {
    if (!producto) return false;
    const nombre = (producto.nombre || '').toLowerCase();
    const descCat = (producto.categoria?.descripcion || '').toLowerCase();
    const idCat = (producto.categoria?.id || '').toLowerCase();
    return (
      nombre.startsWith('promo') ||
      nombre.startsWith('combo') ||
      nombre.includes('duo pack') ||
      descCat.includes('promo') ||
      descCat.includes('combo') ||
      idCat.includes('promo') ||
      idCat.includes('combo')
    );
  }

  readonly promocionesDestacadas = computed(() => {
    const promos = this.presenter.promociones();
    const todosProductos = this.presenter.productos();

    return promos.map(promo => {
      const products = (promo.productIds || [])
        .map(id => todosProductos.find(p => p.id === id))
        .filter((p): p is Producto => !!p);

      const itemsList = products.map(p => p.nombre);
      const originalPrice = products.reduce((acc, p) => acc + (p.precio || 0), 0);
      const discountPercentage = promo.discountPercentage || 0;
      const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));

      const firstProductImage = products.find(p => p.imagen)?.imagen;
      const defaultPromoImage = 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80';
      const imagen = firstProductImage || defaultPromoImage;

      const uniqueClasificaciones = Array.from(
        new Map(
          products.flatMap(p => p.clasificacionesSalud || []).map(c => [c.id, c])
        ).values()
      );

      return {
        id: promo.id,
        nombre: promo.name,
        descripcion: products.map(p => p.nombre).join(' + '),
        itemsList,
        precio: discountedPrice,
        precioOriginal: originalPrice,
        descuento: discountPercentage > 0 ? `-${Math.round(discountPercentage)}%` : '',
        imagen,
        esPromoReal: true,
        categoria: products[0]?.categoria || { id: 'promociones', descripcion: 'Promociones' },
        clasificacionesSalud: uniqueClasificaciones
      };
    });
  });

  readonly promocionesDestacadasFiltradas = computed(() => {
    const promos = this.promocionesDestacadas();
    const { busqueda, categoriaId, precioMin, precioMax } = this.presenter.filtros();
    const texto = busqueda.trim().toLowerCase();
    
    return promos.filter(p => {
      if (texto && !p.nombre.toLowerCase().includes(texto) && !p.descripcion.toLowerCase().includes(texto)) {
        return false;
      }
      if (precioMin !== null && p.precio < precioMin) return false;
      if (precioMax !== null && p.precio > precioMax) return false;
      if (categoriaId !== 'todas' && p.categoria?.id !== categoriaId) {
        return false;
      }
      return true;
    });
  });

  readonly productosSueltos = computed(() => {
    return this.presenter.productosFiltrados().filter(p => !this.esPromocion(p));
  });

  protected scrollCarousel(direction: number): void {
    if (!this.promosContainer) return;
    const total = this.promocionesDestacadasFiltradas().length;
    if (total <= 1) return;

    const currentIndex = this.activeSlideIndex();
    if (direction === 1 && currentIndex >= total - 1) {
      this.scrollToSlide(0);
      return;
    }
    if (direction === -1 && currentIndex <= 0) {
      this.scrollToSlide(total - 1);
      return;
    }

    const container = this.promosContainer.nativeElement;
    const card = container.querySelector('.promo-card');
    const cardWidth = card ? card.getBoundingClientRect().width : 340;
    const gap = 24;
    container.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
  }

  protected onCarouselScroll(event: Event): void {
    const container = event.target as HTMLDivElement;
    const card = container.querySelector('.promo-card');
    const cardWidth = card ? card.getBoundingClientRect().width : 340;
    const gap = 24;
    const step = cardWidth + gap;
    const index = Math.round(container.scrollLeft / step);
    this.activeSlideIndex.set(index);
  }

  protected scrollToSlide(index: number): void {
    if (!this.promosContainer) return;
    const container = this.promosContainer.nativeElement;
    const card = container.querySelector('.promo-card');
    const cardWidth = card ? card.getBoundingClientRect().width : 340;
    const gap = 24;
    const step = cardWidth + gap;
    container.scrollTo({ left: index * step, behavior: 'smooth' });
  }

  protected isAtStart(): boolean {
    return this.activeSlideIndex() === 0;
  }

  protected isAtEnd(): boolean {
    return this.activeSlideIndex() >= this.promocionesDestacadasFiltradas().length - 1;
  }

  protected puedeComprarPromo(promo: any): boolean {
    const alumno = this.presenter.alumno();
    if (!alumno) return false;

    // Construir un Producto temporal para la validación del CarritoService
    const pTemp: Producto = {
      id: promo.id,
      nombre: promo.nombre,
      descripcion: promo.descripcion || '',
      precio: promo.precio,
      categoria: promo.categoria || { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: promo.clasificacionesSalud || [],
      imagen: promo.imagen || '',
      estadoStock: 'DISPONIBLE'
    };

    return this.carritoService.puedeAgregar(pTemp, alumno.id, 1);
  }

  protected agregarPromoAlCarrito(promo: any): void {
    const alumno = this.presenter.alumno();
    if (!alumno) return;

    // Si es una promocion real de la base de datos o fallback, creamos un producto temporal
    // que se agrega al carrito usando la interfaz Producto, con el ID de la promocion.
    const pTemp: Producto = {
      id: promo.id,
      nombre: promo.nombre,
      descripcion: promo.descripcion || '',
      precio: promo.precio,
      categoria: promo.categoria || { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: promo.clasificacionesSalud || [],
      imagen: promo.imagen || '',
      estadoStock: 'DISPONIBLE'
    };

    this.presenter.agregarAlCarrito(pTemp, 1);
  }

  constructor() {
    effect(() => {
      const selectedDate = this.presenter.fechaSeleccionada();
      if (selectedDate) {
        this.generateCalendar(selectedDate);
      }
    });
  }

  ngOnInit(): void {
    this.usuarioService.setHomeUrl(this.homeUrlPorRol());
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    void this.inicializarBuffet(alumnoId);
  }

  private async inicializarBuffet(alumnoId: string): Promise<void> {
    try {
      await this.alumnosService.asegurarCargados(true);
    } catch (err) {
      console.error('Error al cargar alumnos para el buffet:', err);
    }

    this.presenter.init(alumnoId);
  }

  protected onBusqueda(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.buscar(target.value);
  }

  protected onCategoria(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.seleccionarCategoria(target.value);
  }

  protected onClasificacion(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.seleccionarClasificacion(target.value);
  }

  protected onToggleSoloFavoritos(): void {
    this.presenter.toggleSoloFavoritos();
  }

  protected onPrecioMinCambia(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value ? parseFloat(target.value) : null;
    this.presenter.setPrecioMin(val);
  }

  protected onPrecioMaxCambia(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = target.value ? parseFloat(target.value) : null;
    this.presenter.setPrecioMax(val);
  }

  protected abrirSelector(): void {
    this.mostrarSelector.set(true);
  }

  protected cerrarSelector(): void {
    this.mostrarSelector.set(false);
  }

  protected onAlumnoSeleccionado(alumnoId: string): void {
    this.cerrarSelector();
    this.presenter.cambiarAlumno(alumnoId);
  }

  protected onFechaCambia(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.setFecha(target.value);
  }

  protected onRecreoCambia(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.setRecreo(target.value as Recreo);
  }

  protected get saldoFormateado(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(this.presenter.saldo());
  }

  protected formatARS(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(monto);
  }

  protected formatFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const [year, month, day] = fechaStr.split('-');
    return `${day}/${month}/${year}`;
  }

  protected readonly nombreMesCalendario = computed(() => {
    const selectedDate = this.presenter.fechaSeleccionada();
    if (!selectedDate) return '';
    const date = new Date(selectedDate + 'T12:00:00');
    const formatted = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  });

  protected generateCalendar(referenceDateStr: string): void {
    if (!referenceDateStr) return;
    const refDate = new Date(referenceDateStr + 'T12:00:00');
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - (startDayOfWeek - 1));
    
    const cells: DateCell[] = [];
    const minDateStr = this.presenter.fechaMinima();
    const selectedDateStr = this.presenter.fechaSeleccionada();
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const fechaStr = `${yyyy}-${mm}-${dd}`;
      
      const dayOfWeek = currentDate.getDay();
      const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6;
      
      const bloqueado = fechaStr < minDateStr || esFinDeSemana;
      
      cells.push({
        date: currentDate,
        fechaStr,
        nroDia: currentDate.getDate(),
        fueraDeMes: currentDate.getMonth() !== month,
        esFinDeSemana,
        bloqueado,
        seleccionada: fechaStr === selectedDateStr
      });
    }
    
    this.diasCalendario.set(cells);
  }

  protected seleccionarDiaCalendario(cell: DateCell): void {
    if (cell.bloqueado) return;
    this.presenter.setFecha(cell.fechaStr);
  }

  private homeUrlPorRol(): string {
    const rol = this.perfilService.rol();
    if (rol === 'ALUMNO') return '/alumno';
    if (rol === 'VENDEDOR') return '/kiosquero';
    return '/tutor';
  }

  protected obtenerRangoHorario(recreo: Recreo): string {
    const slot = this.presenter.franjas().find(s => {
      if (!s.descripcion) return false;
      const desc = s.descripcion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (recreo === 'PRIMER_RECREO') return desc.includes('primer') && desc.includes('recreo');
      if (recreo === 'SEGUNDO_RECREO') return desc.includes('segundo') && desc.includes('recreo');
      if (recreo === 'MEDIODIA') return desc.includes('mediodia') || desc.includes('medio dia') || desc.includes('almuerzo');
      if (recreo === 'FUERA_HORA') return desc.includes('salida') || desc.includes('despues') || desc.includes('final');
      return false;
    });
    
    if (slot && slot.horaInicio && slot.horaFin) {
      const formatTime = (timeStr: string) => {
        const parts = timeStr.split(':');
        return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : timeStr;
      };
      return `${formatTime(slot.horaInicio)} - ${formatTime(slot.horaFin)}`;
    }
    return '';
  }
}
