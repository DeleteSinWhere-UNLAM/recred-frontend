import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';
import { NivelAlerta, PrediccionGasto } from '../../models/presupuesto.model';

const CIRCUMFERENCIA = 2 * Math.PI * 52;

@Component({
  selector: 'app-prediccion-card',
  templateUrl: './prediccion-card.component.html',
  styleUrl: './prediccion-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrediccionCardComponent {
  private readonly prediccionState = signal<PrediccionGasto | undefined>(
    undefined,
  );
  private readonly nivelState = signal<NivelAlerta>('ok');

  @Input({ required: true })
  set prediccion(valor: PrediccionGasto | undefined) {
    this.prediccionState.set(valor);
  }

  @Input({ required: true })
  set nivel(valor: NivelAlerta) {
    this.nivelState.set(valor);
  }

  readonly prediccionActual = this.prediccionState.asReadonly();
  readonly nivelActual = this.nivelState.asReadonly();

  readonly porcentajeRedondeado = computed(() =>
    Math.round(this.prediccionState()?.porcentajePresupuesto ?? 0),
  );

  readonly dashArray = computed(() => {
    const pct = Math.min(this.porcentajeRedondeado(), 100);
    const lleno = (pct / 100) * CIRCUMFERENCIA;
    return `${lleno} ${CIRCUMFERENCIA - lleno}`;
  });

  readonly circumferencia = CIRCUMFERENCIA;

  readonly nivelLabel = computed(() => {
    switch (this.nivelState()) {
      case 'excedido':
        return 'Excede el presupuesto';
      case 'warning':
        return 'Cerca del límite';
      default:
        return 'En curso';
    }
  });

  formatear(monto: number | undefined): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(monto ?? 0);
  }

  confianzaPorcentaje(confianza: number | undefined): number {
    return Math.round((confianza ?? 0) * 100);
  }
}
