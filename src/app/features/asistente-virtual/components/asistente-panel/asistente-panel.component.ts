import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  computed,
  effect,
  signal,
} from '@angular/core';
import {
  CapacidadAsistente,
  SugerenciaCapacidad,
} from '../../models/capacidad-asistente.model';
import { MensajeAsistente } from '../../models/mensaje-asistente.model';
import { InputMensajeComponent } from '../input-mensaje/input-mensaje.component';
import { MensajeBurbujaComponent } from '../mensaje-burbuja/mensaje-burbuja.component';
import { SugerenciasChipsComponent } from '../sugerencias-chips/sugerencias-chips.component';

type GrupoOpcionesId =
  | 'cuenta'
  | 'compras'
  | 'menu'
  | 'pedidos'
  | 'familia'
  | 'control'
  | 'buffet'
  | 'eventos'
  | 'general';

interface GrupoOpcionesAsistente {
  readonly id: GrupoOpcionesId;
  readonly label: string;
  readonly opciones: readonly SugerenciaCapacidad[];
}

const ORDEN_GRUPOS: readonly GrupoOpcionesId[] = [
  'cuenta',
  'compras',
  'menu',
  'pedidos',
  'familia',
  'control',
  'buffet',
  'eventos',
  'general',
];

const LABEL_GRUPOS: Record<GrupoOpcionesId, string> = {
  cuenta: 'Cuenta',
  compras: 'Compras',
  menu: 'Menu y productos',
  pedidos: 'Pedidos y retiro',
  familia: 'Familia',
  control: 'Controles',
  buffet: 'Buffet',
  eventos: 'Eventos',
  general: 'General',
};

const GRUPO_POR_CAPACIDAD: Record<CapacidadAsistente, GrupoOpcionesId> = {
  SALDO: 'cuenta',
  PAGOS: 'cuenta',
  COMPRAS: 'compras',
  EVENTOS: 'eventos',
  MENU: 'menu',
  PRODUCTOS: 'menu',
  HIJOS: 'familia',
  PRESUPUESTOS: 'control',
  RESTRICCIONES: 'control',
  STOCK: 'buffet',
  VENTAS: 'buffet',
  PEDIDOS: 'pedidos',
  PEDIDOS_PENDIENTES: 'pedidos',
  CODIGO_RETIRO: 'pedidos',
};

@Component({
  selector: 'app-asistente-panel',
  templateUrl: './asistente-panel.component.html',
  styleUrl: './asistente-panel.component.css',
  imports: [InputMensajeComponent, MensajeBurbujaComponent, SugerenciasChipsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AsistentePanelComponent implements AfterViewInit {
  private readonly mensajesState = signal<readonly MensajeAsistente[]>([]);
  private readonly sugerenciasState = signal<readonly SugerenciaCapacidad[]>([]);
  private readonly opcionesState = signal<readonly SugerenciaCapacidad[]>([]);
  private readonly enviandoState = signal(false);
  private readonly deshabilitadoState = signal(false);
  private readonly mostrarHistorialState = signal(false);
  private readonly accionesAbiertasState = signal(true);
  private readonly mostrarSelectorFechaRetiroState = signal(false);
  private readonly fechaRetiroMinimaState = signal('');

  @Input({ required: true })
  set mensajes(valor: readonly MensajeAsistente[]) {
    this.mensajesState.set(valor);
  }

  @Input({ required: true })
  set sugerencias(valor: readonly SugerenciaCapacidad[]) {
    this.sugerenciasState.set(valor);
  }

  @Input()
  set opciones(valor: readonly SugerenciaCapacidad[]) {
    this.opcionesState.set(valor);
  }

  @Input()
  set enviando(valor: boolean) {
    this.enviandoState.set(valor);
  }

  @Input()
  set deshabilitado(valor: boolean) {
    this.deshabilitadoState.set(valor);
  }

  @Input()
  set mostrarHistorial(valor: boolean) {
    this.mostrarHistorialState.set(valor);
  }

  @Input()
  set mostrarSelectorFechaRetiro(valor: boolean) {
    this.mostrarSelectorFechaRetiroState.set(valor);
  }

  @Input()
  set fechaRetiroMinima(valor: string) {
    this.fechaRetiroMinimaState.set(valor);
  }

  @Output() cerrar = new EventEmitter<void>();
  @Output() enviar = new EventEmitter<string>();
  @Output() sugerencia = new EventEmitter<string>();
  @Output() fechaRetiro = new EventEmitter<string>();
  @Output() nuevaConversacion = new EventEmitter<void>();
  @Output() verHistorial = new EventEmitter<void>();

  @ViewChild('scroll') private readonly scrollEl?: ElementRef<HTMLDivElement>;
  @ViewChild(InputMensajeComponent) private readonly inputComp?: InputMensajeComponent;

  protected readonly mensajes_ = this.mensajesState.asReadonly();
  protected readonly sugerencias_ = this.sugerenciasState.asReadonly();
  protected readonly opciones_ = this.opcionesState.asReadonly();
  protected readonly enviando_ = this.enviandoState.asReadonly();
  protected readonly deshabilitado_ = this.deshabilitadoState.asReadonly();
  protected readonly mostrarHistorial_ = this.mostrarHistorialState.asReadonly();
  protected readonly accionesAbiertas_ = this.accionesAbiertasState.asReadonly();
  protected readonly mostrarSelectorFechaRetiro_ =
    this.mostrarSelectorFechaRetiroState.asReadonly();
  protected readonly fechaRetiroMinima_ =
    this.fechaRetiroMinimaState.asReadonly();
  protected readonly gruposOpciones = computed(() =>
    this.crearGruposOpciones(this.opcionesState()),
  );

  constructor() {
    effect(() => {
      this.mensajesState();
      this.enviandoState();
      queueMicrotask(() => this.scrollAlFondo());
    });
  }

  ngAfterViewInit(): void {
    this.inputComp?.enfocar();
    this.scrollAlFondo();
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cerrar.emit();
  }

  protected onCerrar(): void {
    this.cerrar.emit();
  }

  protected onNuevaConversacion(): void {
    this.nuevaConversacion.emit();
  }

  protected onVerHistorial(): void {
    this.verHistorial.emit();
  }

  protected onEnviar(texto: string): void {
    this.enviar.emit(texto);
  }

  protected onSugerencia(prompt: string): void {
    this.sugerencia.emit(prompt);
  }

  protected onFechaRetiroSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    if (!valor || this.deshabilitadoState()) return;
    if (this.fechaRetiroMinimaState() && valor < this.fechaRetiroMinimaState()) {
      input.value = '';
      return;
    }

    this.fechaRetiro.emit(valor);
    input.value = '';
  }

  protected onToggleAcciones(): void {
    if (this.opcionesState().length === 0) return;
    this.accionesAbiertasState.update((abiertas) => !abiertas);
  }

  protected onOpcion(opcion: SugerenciaCapacidad): void {
    if (this.deshabilitadoState()) return;
    this.accionesAbiertasState.set(false);
    this.sugerencia.emit(opcion.prompt);
  }

  protected trackById(_index: number, mensaje: MensajeAsistente): string {
    return mensaje.id;
  }

  protected trackByGrupo(_index: number, grupo: GrupoOpcionesAsistente): string {
    return grupo.id;
  }

  protected trackByOpcion(
    _index: number,
    opcion: SugerenciaCapacidad,
  ): string {
    return opcion.id;
  }

  private crearGruposOpciones(
    opciones: readonly SugerenciaCapacidad[],
  ): readonly GrupoOpcionesAsistente[] {
    const grupos = new Map<GrupoOpcionesId, SugerenciaCapacidad[]>();

    for (const opcion of opciones) {
      const grupoId = opcion.capacidad
        ? GRUPO_POR_CAPACIDAD[opcion.capacidad]
        : 'general';
      const opcionesGrupo = grupos.get(grupoId) ?? [];
      opcionesGrupo.push(opcion);
      grupos.set(grupoId, opcionesGrupo);
    }

    return ORDEN_GRUPOS.flatMap((id) => {
      const opcionesGrupo = grupos.get(id);
      if (!opcionesGrupo || opcionesGrupo.length === 0) return [];

      return [
        {
          id,
          label: LABEL_GRUPOS[id],
          opciones: opcionesGrupo,
        },
      ];
    });
  }

  private scrollAlFondo(): void {
    const el = this.scrollEl?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}
