import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginSubmitButtonComponent } from '../../login/components/login-submit-button/login-submit-button.component';
import { LoginTextFieldComponent } from '../../login/components/login-text-field/login-text-field.component';
import { SolicitarCodigoPresenter } from './presenter/solicitar-codigo.presenter';

@Component({
  selector: 'app-solicitar-codigo-page',
  templateUrl: './solicitar-codigo.page.html',
  styleUrl: './solicitar-codigo.page.css',
  imports: [LoginTextFieldComponent, LoginSubmitButtonComponent],
  providers: [SolicitarCodigoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitarCodigoPage {
  protected readonly presenter = inject(SolicitarCodigoPresenter);

  protected onEmailChange(valor: string): void {
    this.presenter.actualizarEmail(valor);
  }

  protected onSubmit(): void {
    this.presenter.enviar();
  }

  protected onIrALogin(): void {
    this.presenter.volverAlLogin();
  }

  protected onVolver(): void {
    this.presenter.volverAlInicio();
  }
}
