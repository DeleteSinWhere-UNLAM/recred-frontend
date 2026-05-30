import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginSubmitButtonComponent } from '../../login/components/login-submit-button/login-submit-button.component';
import { OtpInputComponent } from '../components/otp-input/otp-input.component';
import { ValidarCodigoPresenter } from './presenter/validar-codigo.presenter';

@Component({
  selector: 'app-validar-codigo-page',
  templateUrl: './validar-codigo.page.html',
  styleUrl: './validar-codigo.page.css',
  imports: [OtpInputComponent, LoginSubmitButtonComponent],
  providers: [ValidarCodigoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidarCodigoPage {
  protected readonly presenter = inject(ValidarCodigoPresenter);

  protected onCodigoChange(valor: string): void {
    this.presenter.actualizarCodigo(valor);
  }

  protected onSubmit(): void {
    this.presenter.enviar();
  }

  protected onReenviar(): void {
    this.presenter.reenviarCodigo();
  }

  protected onVolver(): void {
    this.presenter.volverAlInicio();
  }
}
