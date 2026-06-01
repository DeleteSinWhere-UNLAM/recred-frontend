import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

export interface ResumenLinea {
  alumnoId: string;
  nombre: string;
  subtotal: number;
  incluido: boolean;
}

@Component({
  selector: 'app-resumen-orden-card',
  templateUrl: './resumen-orden-card.component.html',
  styleUrl: './resumen-orden-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenOrdenCardComponent {
  private readonly lineasState = signal<ResumenLinea[]>([]);

  @Input({ required: true })
  set lineas(valor: ResumenLinea[]) {
    this.lineasState.set(valor);
  }

  @Input() total = 0;
  @Input() ctaLabel = 'Avanzar al Pago';
  @Input() ctaDeshabilitado = false;
  @Input() cargando = false;
  @Input() advertencia: string | null = null;

  @Output() accion = new EventEmitter<void>();

  readonly lineasActuales = computed(() => this.lineasState());

  readonly totalFormateado = computed(() =>
    formateadorPrecio.format(this.total),
  );

  formatear(valor: number): string {
    return formateadorPrecio.format(valor);
  }
}
