import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { RECREO_LABELS, Recreo } from '../../models/orden-compra.model';

@Component({
  selector: 'app-codigo-retiro-card',
  templateUrl: './codigo-retiro-card.component.html',
  styleUrl: './codigo-retiro-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodigoRetiroCardComponent {
  private readonly alumnoState = signal<Alumno | undefined>(undefined);

  @Input({ required: true })
  set alumno(valor: Alumno) {
    this.alumnoState.set(valor);
  }

  @Input({ required: true }) codigo = '';
  @Input() fecha = '';
  @Input() recreo: Recreo = 'PRIMER_RECREO';

  readonly alumnoActual = computed(() => this.alumnoState());

  readonly urlFotoPerfil = computed(() => this.alumnoState()?.urlFotoPerfil ?? null);

  readonly iniciales = computed(() => {
    const a = this.alumnoState();
    if (!a) return '';
    return ((a.nombre[0] ?? '') + (a.apellido[0] ?? '')).toUpperCase();
  });

  readonly nombreCompleto = computed(() => {
    const a = this.alumnoState();
    return a ? `${a.nombre} ${a.apellido}` : '';
  });

  get recreoLabel() {
    return RECREO_LABELS[this.recreo];
  }
}
