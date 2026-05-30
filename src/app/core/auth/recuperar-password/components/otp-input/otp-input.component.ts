import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  signal,
  viewChildren,
} from '@angular/core';

const LARGO_OTP = 6;

@Component({
  selector: 'app-otp-input',
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OtpInputComponent {
  @Input() etiqueta = 'Código';
  @Input() set valor(v: string) {
    this.digitos.set(this.armarDigitos(v));
  }
  @Output() valorCambiado = new EventEmitter<string>();

  protected readonly indices = Array.from({ length: LARGO_OTP }, (_, i) => i);
  protected readonly digitos = signal<string[]>(this.armarDigitos(''));
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('digito');

  protected onInput(index: number, evento: Event): void {
    const target = evento.target as HTMLInputElement;
    const char = target.value.slice(-1).replace(/\D/g, '');
    target.value = char;
    const next = [...this.digitos()];
    next[index] = char;
    this.digitos.set(next);
    this.valorCambiado.emit(next.join(''));
    if (char && index < LARGO_OTP - 1) {
      this.inputs()[index + 1]?.nativeElement.focus();
    }
  }

  protected onKeydown(index: number, evento: KeyboardEvent): void {
    if (evento.key === 'Backspace' && !this.digitos()[index] && index > 0) {
      this.inputs()[index - 1]?.nativeElement.focus();
    }
  }

  protected onPaste(evento: ClipboardEvent): void {
    const texto = evento.clipboardData?.getData('text') ?? '';
    const pegados = texto.replace(/\D/g, '').slice(0, LARGO_OTP).split('');
    if (pegados.length === 0) return;
    evento.preventDefault();
    const next = Array.from(
      { length: LARGO_OTP },
      (_, i) => pegados[i] ?? '',
    );
    this.digitos.set(next);
    this.valorCambiado.emit(next.join(''));
    const ultimoLleno = Math.min(pegados.length, LARGO_OTP - 1);
    this.inputs()[ultimoLleno]?.nativeElement.focus();
  }

  private armarDigitos(v: string): string[] {
    return Array.from({ length: LARGO_OTP }, (_, i) => v[i] ?? '');
  }
}
