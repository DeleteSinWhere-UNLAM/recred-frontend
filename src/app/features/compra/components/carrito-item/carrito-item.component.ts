import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
  inject,
} from '@angular/core';
import { ItemCarrito } from '../../models/carrito.model';
import { CarritoService } from '../../services/carrito.service';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-carrito-item',
  templateUrl: './carrito-item.component.html',
  styleUrl: './carrito-item.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarritoItemComponent {
  private readonly carritoService = inject(CarritoService);

  private readonly itemState = signal<ItemCarrito | undefined>(undefined);

  @Input({ required: true })
  set item(valor: ItemCarrito) {
    this.itemState.set(valor);
  }

  @Output() sumar = new EventEmitter<string>();
  @Output() restar = new EventEmitter<string>();
  @Output() eliminar = new EventEmitter<string>();

  readonly itemActual = computed(() => this.itemState());

  readonly deshabilitarSumar = computed(() => {
    const i = this.itemState();
    if (!i) return true;
    return !this.carritoService.puedeAgregar(i.producto, i.alumnoId, 1);
  });

  readonly precioFormateado = computed(() => {
    const i = this.itemState();
    return i ? formateadorPrecio.format(i.producto.precio) : '';
  });

  readonly subtotalFormateado = computed(() => {
    const i = this.itemState();
    return i ? formateadorPrecio.format(i.producto.precio * i.cantidad) : '';
  });

  protected onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === IMAGEN_FALLBACK) return;
    img.src = IMAGEN_FALLBACK;
  }
}

const IMAGEN_FALLBACK =
  'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
