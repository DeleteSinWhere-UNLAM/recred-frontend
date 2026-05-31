import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-login-submit-button',
  templateUrl: './login-submit-button.component.html',
  styleUrl: './login-submit-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginSubmitButtonComponent {
  @Input({ required: true }) texto!: string;
  @Input() textoCargando = 'Ingresando…';
  @Input() disabled = false;
  @Input() cargando = false;
  @Output() clicked = new EventEmitter<void>();

  protected onClick(): void {
    if (this.disabled || this.cargando) return;
    this.clicked.emit();
  }
}
