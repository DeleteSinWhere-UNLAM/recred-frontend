import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginSubmitButtonComponent } from './components/login-submit-button/login-submit-button.component';
import { LoginTextFieldComponent } from './components/login-text-field/login-text-field.component';
import { LoginPresenter } from './presenter/login.presenter';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
  imports: [LoginTextFieldComponent, LoginSubmitButtonComponent],
  providers: [LoginPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  protected readonly presenter = inject(LoginPresenter);

  protected onEmailChange(valor: string): void {
    this.presenter.actualizarEmail(valor);
  }

  protected onPasswordChange(valor: string): void {
    this.presenter.actualizarPassword(valor);
  }

  protected onSubmit(): void {
    this.presenter.enviar();
  }

  protected onIrARegistro(): void {
    this.presenter.irARegistro();
  }

  protected onIrARecuperar(): void {
    this.presenter.irARecuperar();
  }

  protected onVolver(): void {
    this.presenter.volverAlInicio();
  }
}
