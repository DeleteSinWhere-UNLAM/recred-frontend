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
    const todos = this.presenter.productos();
    
    const promoAlmuerzo = todos.find(p => {
      const n = p.nombre.toLowerCase();
      return n.includes('almuerzo') && n.includes('express');
    });
    const comboMerienda = todos.find(p => {
      const n = p.nombre.toLowerCase();
      return n.includes('merienda');
    });
    const duoPack = todos.find(p => {
      const n = p.nombre.toLowerCase();
      return n.includes('duo') || n.includes('pack');
    });

    const list: any[] = [];

    // 1. Promo Almuerzo Express
    if (promoAlmuerzo) {
      list.push({
        ...promoAlmuerzo,
        itemsList: ['Milanesa', 'Puré', 'Bebida'],
        descuento: '-30%',
        imagen: promoAlmuerzo.imagen || 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80',
        esPromoReal: true
      });
    } else {
      list.push({
        id: 'mock-promo-almuerzo-express',
        nombre: 'Promo Almuerzo Express',
        descripcion: 'Milanesa + Puré + Bebida',
        itemsList: ['Milanesa', 'Puré', 'Bebida'],
        precio: 120,
        descuento: '-30%',
        imagen: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=600&q=80',
        esPromoReal: false,
        categoria: { id: 'comidas', descripcion: 'Comidas' }
      });
    }

    // 2. Combo Merienda
    if (comboMerienda) {
      list.push({
        ...comboMerienda,
        itemsList: ['Café', 'Factura', 'Jugo de Naranja'],
        descuento: '-50%',
        imagen: comboMerienda.imagen || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
        esPromoReal: true
      });
    } else {
      list.push({
        id: 'mock-combo-merienda',
        nombre: 'Combo Merienda',
        descripcion: 'Café + Factura + Jugo de Naranja',
        itemsList: ['Café', 'Factura', 'Jugo de Naranja'],
        precio: 130,
        descuento: '-50%',
        imagen: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
        esPromoReal: false,
        categoria: { id: 'bebidas', descripcion: 'Bebidas' }
      });
    }

    // 3. Duo Pack
    if (duoPack) {
      list.push({
        ...duoPack,
        itemsList: ['Patas', 'Pack...'],
        descuento: '',
        imagen: duoPack.imagen || 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80',
        esPromoReal: true
      });
    } else {
      list.push({
        id: 'mock-duo-pack',
        nombre: 'Duo Pack',
        descripcion: 'Patas + Pack...',
        itemsList: ['Patas', 'Pack...'],
        precio: 150,
        descuento: '',
        imagen: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=80',
        esPromoReal: false,
        categoria: { id: 'comidas', descripcion: 'Comidas' }
      });
    }

    // Otras promos del buffet
    for (const p of todos) {
      if (this.esPromocion(p) && p.id !== promoAlmuerzo?.id && p.id !== comboMerienda?.id && p.id !== duoPack?.id) {
        const parts = p.descripcion ? p.descripcion.split('+').map(i => i.trim()) : [p.nombre];
        list.push({
          ...p,
          itemsList: parts,
          descuento: p.precio < 500 ? '-30%' : '',
          esPromoReal: true
        });
      }
    }

    return list;
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

    if (promo.esPromoReal) {
      const p = this.presenter.productos().find(x => x.id === promo.id);
      if (p) {
        this.presenter.agregarAlCarrito(p, 1);
        return;
      }
    }

    // Si es mock o fallback, buscamos si hay un producto real correspondiente o creamos uno temporal
    // que se agrega al carrito usando la interfaz Producto
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
