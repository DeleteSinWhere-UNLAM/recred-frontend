import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { Producto, disponible } from '../../models/producto.model';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-producto-card',
  templateUrl: './producto-card.component.html',
  styleUrl: './producto-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductoCardComponent {
  private readonly productoState = signal<Producto | undefined>(undefined);

  @Input({ required: true })
  set producto(valor: Producto) {
    this.productoState.set(valor);
  }

  @Output() agregar = new EventEmitter<Producto>();

  readonly productoActual = computed(() => this.productoState());
  readonly disponible = computed(() => {
    const p = this.productoState();
    return p ? disponible(p) : false;
  });
  readonly precioFormateado = computed(() => {
    const p = this.productoState();
    return p ? formateadorPrecio.format(p.precio) : '';
  });

  protected onAgregar(): void {
    const p = this.productoState();
    if (p && disponible(p)) {
      this.agregar.emit(p);
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
