import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { ItemCarrito } from '../../models/carrito.model';

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
  private readonly itemState = signal<ItemCarrito | undefined>(undefined);

  @Input({ required: true })
  set item(valor: ItemCarrito) {
    this.itemState.set(valor);
  }

  @Output() sumar = new EventEmitter<string>();
  @Output() restar = new EventEmitter<string>();
  @Output() eliminar = new EventEmitter<string>();

  readonly itemActual = computed(() => this.itemState());

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
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'>
      <rect width='80' height='80' fill='#E8EDF3'/>
      <text x='40' y='44' text-anchor='middle' font-family='sans-serif' font-size='10' fill='#94A3B8'>Sin imagen</text>
    </svg>`,
  );
