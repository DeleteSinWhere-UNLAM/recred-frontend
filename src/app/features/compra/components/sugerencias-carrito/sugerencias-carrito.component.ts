import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import {
  OrigenSugerenciaCarrito,
  SugerenciaCarrito,
} from '../../models/sugerencia-carrito.model';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

interface SugerenciaVista {
  sugerencia: SugerenciaCarrito;
  precioFormateado: string;
  etiqueta: string;
  icono: string;
  colorClass: string;
}

const ETIQUETAS_POR_SOURCE: Record<OrigenSugerenciaCarrito, { label: string; icono: string; color: string }> = {
  FAVORITE: { label: 'Favorito', icono: 'fa-heart', color: 'melocoton' },
  DETECTED_PREFERENCE: { label: 'Preferencia', icono: 'fa-wand-magic-sparkles', color: 'melocoton' },
  PURCHASE_HISTORY: { label: 'Frecuente', icono: 'fa-arrows-rotate', color: 'pizarra' },
  DAY_PATTERN: { label: 'Te puede gustar hoy', icono: 'fa-calendar-day', color: 'pizarra' },
  STUDENT_CART_AFFINITY: { label: 'Suele acompañar tu carrito', icono: 'fa-link', color: 'menta' },
  BUFFET_CART_AFFINITY: { label: 'Combo frecuente', icono: 'fa-people-group', color: 'menta' },
};

@Component({
  selector: 'app-sugerencias-carrito',
  templateUrl: './sugerencias-carrito.component.html',
  styleUrl: './sugerencias-carrito.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SugerenciasCarritoComponent {
  private readonly sugerenciasState = signal<SugerenciaCarrito[]>([]);
  private readonly cargandoState = signal(false);

  @Input({ required: true })
  set sugerencias(valor: SugerenciaCarrito[]) {
    this.sugerenciasState.set(valor ?? []);
  }

  @Input()
  set cargando(valor: boolean) {
    this.cargandoState.set(!!valor);
  }

  @Output() agregar = new EventEmitter<SugerenciaCarrito>();

  readonly vistas = computed<SugerenciaVista[]>(() =>
    this.sugerenciasState().map((s) => {
      const meta = ETIQUETAS_POR_SOURCE[s.source] ?? {
        label: 'Sugerido',
        icono: 'fa-sparkles',
        color: 'pizarra',
      };
      return {
        sugerencia: s,
        precioFormateado: formateadorPrecio.format(s.price),
        etiqueta: meta.label,
        icono: meta.icono,
        colorClass: `sugerencias-carrito__chip--${meta.color}`,
      };
    }),
  );

  readonly hayResultados = computed(() => this.sugerenciasState().length > 0);
  readonly estaCargando = computed(() => this.cargandoState());

  protected onAgregar(sugerencia: SugerenciaCarrito): void {
    this.agregar.emit(sugerencia);
  }
}
