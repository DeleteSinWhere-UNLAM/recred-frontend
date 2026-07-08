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
import { PerfilService } from '../../../../data-access/services/perfil.service';
import { Producto, disponible } from '../../models/producto.model';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-producto-card',
  templateUrl: './producto-card.component.html',
  styleUrl: './producto-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoCardComponent {
  private readonly carritoService = inject(CarritoService);
  private readonly perfilService = inject(PerfilService);

  private readonly productoState = signal<Producto | undefined>(undefined);
  private readonly alumnoIdState = signal<string>('');

  @Input({ required: true })
  set producto(valor: Producto) {
    this.productoState.set(valor);
  }

  @Input({ required: true })
  set alumnoId(valor: string) {
    this.alumnoIdState.set(valor);
  }

  @Input() esFavorito = false;
  @Input() mostrarCandado = false;
 
  @Output() cambioCantidad = new EventEmitter<{ producto: Producto; cantidad: number }>();
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
  protected readonly esPremium = computed(() => !this.perfilService.esPlanGratuito());

  readonly disponible = computed(() => {
    const p = this.productoState();
    return p ? (disponible(p) && !p.bloqueado && !p.bloqueadoPorRestriccion && !this.superaPresupuestoUnitario()) : false;
  });

  readonly bloqueadoPorRestriccion = computed(() => {
    return !!this.productoState()?.bloqueadoPorRestriccion;
  });

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

    const contenido = motivo.replace(/^Contiene:\s*/i, '');
    const partes = contenido.split(',').map(p => p.trim());
    const etiquetas = partes.map(p => MAPA[p] ?? p);
    return 'No apto: ' + etiquetas.join(' · ');
  });

  readonly razonRechazo = computed(() => {
    const p = this.productoState();
    const alumnoId = this.alumnoIdState();
    if (!p || !alumnoId) return null;
    const validation = this.carritoService.validarAgregar(p, alumnoId, this.cantidadEnCarrito());
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
    return !this.carritoService.puedeAgregar(p, alumnoId, this.cantidadEnCarrito() + 1);
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

  protected sumar(): void {
    const p = this.productoState();
    if (p) {
      this.cambioCantidad.emit({ producto: p, cantidad: this.cantidadEnCarrito() + 1 });
    }
  }

  protected restar(): void {
    const p = this.productoState();
    if (p && this.cantidadEnCarrito() > 0) {
      this.cambioCantidad.emit({ producto: p, cantidad: this.cantidadEnCarrito() - 1 });
    }
  }

  protected onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === IMAGEN_FALLBACK) return;
    img.src = IMAGEN_FALLBACK;
  }
}

const IMAGEN_FALLBACK =
  'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
