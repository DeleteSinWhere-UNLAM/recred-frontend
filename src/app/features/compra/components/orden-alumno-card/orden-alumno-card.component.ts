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
import { Alumno } from '../../../../data-access/models/alumno.model';
import { ItemCarrito } from '../../models/carrito.model';
import { Recreo, RECREO_LABELS } from '../../models/orden-compra.model';
import { CarritoItemComponent } from '../carrito-item/carrito-item.component';
import { RecreoOpcion } from '../../carrito/presenter/carrito.presenter';
import { UsuarioService } from '../../../../data-access/services/usuario.service';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
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
  private readonly usuarioService = inject(UsuarioService);
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
  @Input() recreosDisponibles: RecreoOpcion[] = [];
  @Input() fechaMinima = '';
  @Input() motivoBloqueoPresupuesto?: string;
  @Input() modoSoloLectura = false;
  @Input() favoritoDeshabilitado = false;

  @Output() toggleSeleccion = new EventEmitter<void>();
  @Output() fechaCambia = new EventEmitter<string>();
  @Output() recreoCambia = new EventEmitter<Recreo>();
  @Output() sumarItem = new EventEmitter<string>();
  @Output() restarItem = new EventEmitter<string>();
  @Output() eliminarItem = new EventEmitter<string>();
  @Output() guardarFavorito = new EventEmitter<void>();
  @Output() editarRetiro = new EventEmitter<void>();

  readonly alumnoActual = computed(() => this.alumnoState());
  readonly itemsActuales = computed(() => this.itemsState());

  readonly urlFotoPerfil = computed(() => this.alumnoState()?.urlFotoPerfil ?? null);

  readonly iniciales = computed(() => {
    const a = this.alumnoState();
    if (!a) return '';
    if (this.usuarioService.esVistaAlumno()) {
      return ((a.nombre[0] ?? '') + (a.apellido[0] ?? '')).toUpperCase();
    }
    return (a.nombre[0] ?? '').toUpperCase();
  });

  readonly nombreCompleto = computed(() => {
    const a = this.alumnoState();
    if (!a) return '';
    if (this.usuarioService.esVistaAlumno()) {
      return `${a.nombre} ${a.apellido}`;
    }
    return `${a.nombre}`;
  });

  readonly subtotal = computed(() =>
    this.itemsState().reduce(
      (acc, i) => acc + i.producto.precio * i.cantidad,
      0,
    ),
  );

  readonly fechaFormateada = computed(() => {
    if (!this.fecha) return '—';
    const [year, month, day] = this.fecha.split('-');
    return `${day}/${month}/${year}`;
  });

  readonly recreoLabel = computed(() => RECREO_LABELS[this.recreo] ?? this.recreo);

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
