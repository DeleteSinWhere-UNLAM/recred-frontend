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
import { PerfilService } from '../../../../data-access/services/perfil.service';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
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
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenOrdenCardComponent {
  private readonly perfilService = inject(PerfilService);
  readonly esPremium = computed(() => this.perfilService.perfil()?.plan === 'PREMIUM');

  private readonly lineasState = signal<ResumenLinea[]>([]);
  private readonly totalState = signal<number>(0);

  @Input({ required: true })
  set lineas(valor: ResumenLinea[]) {
    this.lineasState.set(valor);
  }

  @Input()
  set total(valor: number) {
    this.totalState.set(valor);
  }
  get total(): number {
    return this.totalState();
  }

  @Input() ctaLabel = 'Avanzar al Pago';
  @Input() ctaDeshabilitado = false;
  @Input() cargando = false;
  @Input() advertencia: string | null = null;

  @Output() accion = new EventEmitter<void>();

  readonly lineasActuales = computed(() => this.lineasState());

  readonly totalFormateado = computed(() =>
    formateadorPrecio.format(this.totalState()),
  );

  formatear(valor: number): string {
    return formateadorPrecio.format(valor);
  }
}
