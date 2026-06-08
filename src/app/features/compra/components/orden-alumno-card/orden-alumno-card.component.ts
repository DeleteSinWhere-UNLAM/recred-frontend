import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { ItemCarrito } from '../../models/carrito.model';
import { Recreo } from '../../models/orden-compra.model';
import { CarritoItemComponent } from '../carrito-item/carrito-item.component';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-orden-alumno-card',
  templateUrl: './orden-alumno-card.component.html',
  styleUrl: './orden-alumno-card.component.css',
  imports: [CarritoItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdenAlumnoCardComponent {
  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly itemsState = signal<ItemCarrito[]>([]);

  @Input({ required: true })
  set alumno(valor: Alumno) {
    this.alumnoState.set(valor);
  }

  @Input({ required: true })
  set items(valor: ItemCarrito[]) {
    this.itemsState.set(valor);
  }

  @Input() seleccionado = false;
  @Input() fecha = '';
  @Input() recreo: Recreo = 'PRIMER_RECREO';
  @Input() fechaMinima = '';
  @Input() errorPresupuesto: string | null = null;

  @Output() toggleSeleccion = new EventEmitter<void>();
  @Output() fechaCambia = new EventEmitter<string>();
  @Output() recreoCambia = new EventEmitter<Recreo>();
  @Output() sumarItem = new EventEmitter<string>();
  @Output() restarItem = new EventEmitter<string>();
  @Output() eliminarItem = new EventEmitter<string>();

  readonly alumnoActual = computed(() => this.alumnoState());
  readonly itemsActuales = computed(() => this.itemsState());

  readonly iniciales = computed(() => {
    const a = this.alumnoState();
    if (!a) return '';
    return ((a.nombre[0] ?? '') + (a.apellido[0] ?? '')).toUpperCase();
  });

  readonly nombreCompleto = computed(() => {
    const a = this.alumnoState();
    return a ? `${a.nombre} ${a.apellido}` : '';
  });

  readonly subtotal = computed(() =>
    this.itemsState().reduce(
      (acc, i) => acc + i.producto.precio * i.cantidad,
      0,
    ),
  );

  readonly subtotalFormateado = computed(() =>
    formateadorPrecio.format(this.subtotal()),
  );

  readonly saldoFormateado = computed(() => {
    const a = this.alumnoState();
    return a ? formateadorPrecio.format(a.saldo) : '';
  });

  readonly saldoInsuficiente = computed(() => {
    const a = this.alumnoState();
    return a ? a.saldo < this.subtotal() : false;
  });

  protected onFechaCambia(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.fechaCambia.emit(target.value);
  }

  protected onRecreoCambia(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.recreoCambia.emit(target.value as Recreo);
  }
}
