import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CarritoService } from '../../../compra/services/carrito.service';
import { Producto, disponible } from '../../models/producto.model';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export interface AgregarEvento {
  producto: Producto;
  cantidad: number;
}

@Component({
  selector: 'app-producto-card',
  templateUrl: './producto-card.component.html',
  styleUrl: './producto-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoCardComponent {
  private readonly carritoService = inject(CarritoService);

  private readonly productoState = signal<Producto | undefined>(undefined);
  private readonly alumnoIdState = signal<string>('');
  protected readonly cantidad = signal<number>(1);

  @Input({ required: true })
  set producto(valor: Producto) {
    this.productoState.set(valor);
    this.cantidad.set(1);
  }

  @Input({ required: true })
  set alumnoId(valor: string) {
    this.alumnoIdState.set(valor);
  }

  @Input() esFavorito = false;
  @Input() mostrarCandado = false;
 
  @Output() agregar = new EventEmitter<AgregarEvento>();
  @Output() toggleFavorito = new EventEmitter<Producto>();
  @Output() toggleLock = new EventEmitter<Producto>();

  protected onToggleFavorito(event: Event): void {
    event.stopPropagation();
    const p = this.productoState();
    if (p) {
      this.toggleFavorito.emit(p);
    }
  }

  protected onToggleLock(event: Event): void {
    event.stopPropagation();
    const p = this.productoState();
    if (p) {
      this.toggleLock.emit(p);
    }
  }

  readonly productoActual = computed(() => this.productoState());

  readonly disponible = computed(() => {
    const p = this.productoState();
    // No disponible si: sin stock, bloqueado por tutor, por restricción nutricional/horaria, o supera presupuesto unitario
    return p ? (disponible(p) && !p.bloqueado && !p.bloqueadoPorRestriccion && !this.superaPresupuestoUnitario()) : false;
  });

  readonly bloqueadoPorRestriccion = computed(() => {
    return !!this.productoState()?.bloqueadoPorRestriccion;
  });

  /**
   * Convierte el motivoBloqueo del backend en una etiqueta corta para el botón.
   * El backend devuelve: "Contiene: Gluten (TACC), Azúcar, Lácteos"
   * Se mapea a: "No apto: Contiene TACC · Contiene Azúcar · Contiene Lácteos"
   */
  readonly mensajeRestriccion = computed(() => {
    const motivo = this.productoState()?.motivoBloqueo ?? '';
    if (!motivo) return 'No apto';

    const MAPA: Record<string, string> = {
      'Gluten (TACC)':                   'Contiene TACC',
      'Azúcar':                          'Contiene Azúcar',
      'Lácteos':                         'Contiene Lácteos',
      'Alto Sodio':                      'Contiene Sodio',
      'Ingredientes de origen animal':   'No Vegano',
    };

    // El backend prefija con "Contiene: "
    const contenido = motivo.replace(/^Contiene:\s*/i, '');
    const partes = contenido.split(',').map(p => p.trim());
    const etiquetas = partes.map(p => MAPA[p] ?? p);
    return 'No apto: ' + etiquetas.join(' · ');
  });

  readonly razonRechazo = computed(() => {
    const p = this.productoState();
    const alumnoId = this.alumnoIdState();
    if (!p || !alumnoId) return null;
    const validation = this.carritoService.validarAgregar(p, alumnoId, this.cantidad());
    return validation.permitido ? null : validation.razon;
  });

  readonly superaPresupuestoUnitario = computed(() => {
    const p = this.productoState();
    const alumnoId = this.alumnoIdState();
    if (!p || !alumnoId) return false;
    return !this.carritoService.puedeAgregar(p, alumnoId, 1);
  });

  readonly superaPresupuesto = computed(() => {
    return this.razonRechazo() === 'presupuesto' || this.razonRechazo() === 'categoria';
  });

  readonly superaSaldo = computed(() => {
    return this.razonRechazo() === 'saldo';
  });

  readonly deshabilitarSumar = computed(() => {
    const p = this.productoState();
    const alumnoId = this.alumnoIdState();
    if (!p || !alumnoId) return true;
    return !this.carritoService.puedeAgregar(p, alumnoId, this.cantidad() + 1);
  });

  readonly precioFormateado = computed(() => {
    const p = this.productoState();
    return p ? formateadorPrecio.format(p.precio) : '';
  });

  readonly cantidadEnCarrito = computed(() => {
    const p = this.productoState();
    const alumnoId = this.alumnoIdState();
    if (!p || !alumnoId) return 0;
    return this.carritoService.cantidadDe(p.id, alumnoId);
  });

  readonly estaEnCarrito = computed(() => this.cantidadEnCarrito() > 0);

  protected sumar(): void {
    this.cantidad.update((v) => v + 1);
  }

  protected restar(): void {
    this.cantidad.update((v) => (v > 1 ? v - 1 : 1));
  }

  protected onAgregar(): void {
    const p = this.productoState();
    if (p && disponible(p)) {
      this.agregar.emit({ producto: p, cantidad: this.cantidad() });
      this.cantidad.set(1);
    }
  }

  protected onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === IMAGEN_FALLBACK) return;
    img.src = IMAGEN_FALLBACK;
  }
}

const IMAGEN_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'>
      <rect width='200' height='140' fill='#E8EDF3'/>
      <g fill='#94A3B8' transform='translate(72 38)'>
        <path d='M28 8c-11 0-20 9-20 20s9 20 20 20 20-9 20-20S39 8 28 8zm0 6a14 14 0 110 28 14 14 0 010-28z'/>
      </g>
      <text x='100' y='110' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='600' fill='#94A3B8'>Sin imagen</text>
    </svg>`,
  );
