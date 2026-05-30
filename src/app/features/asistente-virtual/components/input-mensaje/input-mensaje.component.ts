import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-mensaje',
  templateUrl: './input-mensaje.component.html',
  styleUrl: './input-mensaje.component.css',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMensajeComponent {
  @Input() deshabilitado = false;

  @Output() enviar = new EventEmitter<string>();

  @ViewChild('inputEl') private readonly inputEl?: ElementRef<HTMLInputElement>;

  protected readonly texto = signal('');

  protected get puedeEnviar(): boolean {
    return !this.deshabilitado && this.texto().trim().length > 0;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.puedeEnviar) return;
    this.enviar.emit(this.texto().trim());
    this.texto.set('');
  }

  enfocar(): void {
    queueMicrotask(() => this.inputEl?.nativeElement.focus());
  }
}
