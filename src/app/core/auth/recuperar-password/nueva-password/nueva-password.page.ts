import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginSubmitButtonComponent } from '../../login/components/login-submit-button/login-submit-button.component';
import { LoginTextFieldComponent } from '../../login/components/login-text-field/login-text-field.component';
import { NuevaPasswordPresenter } from './presenter/nueva-password.presenter';

@Component({
  selector: 'app-nueva-password-page',
  templateUrl: './nueva-password.page.html',
  styleUrl: './nueva-password.page.css',
  imports: [LoginTextFieldComponent, LoginSubmitButtonComponent],
  providers: [NuevaPasswordPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NuevaPasswordPage {
  protected readonly presenter = inject(NuevaPasswordPresenter);

  protected onPasswordChange(valor: string): void {
    this.presenter.actualizarPassword(valor);
  }

  protected onConfirmacionChange(valor: string): void {
    this.presenter.actualizarConfirmacion(valor);
  }

  protected onSubmit(): void {
    this.presenter.enviar();
  }

  protected onIrALogin(): void {
    this.presenter.irALogin();
  }

  protected onVolver(): void {
    this.presenter.volverAlInicio();
  }
}
