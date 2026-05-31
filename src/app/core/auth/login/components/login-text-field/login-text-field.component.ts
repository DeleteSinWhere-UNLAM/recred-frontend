import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

export type TipoCampoLogin = 'text' | 'email' | 'password' | 'tel';

@Component({
  selector: 'app-login-text-field',
  templateUrl: './login-text-field.component.html',
  styleUrl: './login-text-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginTextFieldComponent {
  @Input({ required: true }) etiqueta!: string;
  @Input({ required: true }) tipo!: TipoCampoLogin;
  @Input({ required: true }) valor!: string;
  @Input() placeholder = '';
  @Input() autocomplete = 'off';
  @Output() valorCambiado = new EventEmitter<string>();

  onInput(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.valorCambiado.emit(input.value);
  }
}
