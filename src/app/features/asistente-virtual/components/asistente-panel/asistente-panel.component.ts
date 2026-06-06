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
  private readonly enviandoState = signal(false);

  @Input({ required: true })
  set mensajes(valor: readonly MensajeAsistente[]) {
    this.mensajesState.set(valor);
  }

  @Input({ required: true })
  set sugerencias(valor: readonly SugerenciaCapacidad[]) {
    this.sugerenciasState.set(valor);
  }

  @Input()
  set enviando(valor: boolean) {
    this.enviandoState.set(valor);
  }

  @Output() cerrar = new EventEmitter<void>();
  @Output() enviar = new EventEmitter<string>();
  @Output() sugerencia = new EventEmitter<CapacidadAsistente>();
  @Output() nuevaConversacion = new EventEmitter<void>();

  @ViewChild('scroll') private readonly scrollEl?: ElementRef<HTMLDivElement>;
  @ViewChild(InputMensajeComponent) private readonly inputComp?: InputMensajeComponent;

  protected readonly mensajes_ = this.mensajesState.asReadonly();
  protected readonly sugerencias_ = this.sugerenciasState.asReadonly();
  protected readonly enviando_ = this.enviandoState.asReadonly();

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

  protected onEnviar(texto: string): void {
    this.enviar.emit(texto);
  }

  protected onSugerencia(capacidad: CapacidadAsistente): void {
    this.sugerencia.emit(capacidad);
  }

  protected trackById(_index: number, mensaje: MensajeAsistente): string {
    return mensaje.id;
  }

  private scrollAlFondo(): void {
    const el = this.scrollEl?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}
