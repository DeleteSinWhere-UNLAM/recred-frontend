import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoginSubmitButtonComponent } from '../login/components/login-submit-button/login-submit-button.component';
import { LoginTextFieldComponent } from '../login/components/login-text-field/login-text-field.component';
import { RegistroTipoUsuarioSelectorComponent } from './components/registro-tipo-usuario-selector/registro-tipo-usuario-selector.component';
import { TipoUsuario } from './models/tipo-usuario.model';
import { RegistroPresenter } from './presenter/registro.presenter';

@Component({
  selector: 'app-registro-page',
  templateUrl: './registro.page.html',
  styleUrl: './registro.page.css',
  imports: [
    LoginTextFieldComponent,
    LoginSubmitButtonComponent,
    RegistroTipoUsuarioSelectorComponent,
  ],
  providers: [RegistroPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroPage {
  protected readonly presenter = inject(RegistroPresenter);

  protected onNombreChange(valor: string): void {
    this.presenter.actualizarNombreCompleto(valor);
  }

  protected onEmailChange(valor: string): void {
    this.presenter.actualizarEmail(valor);
  }

  protected onPasswordChange(valor: string): void {
    this.presenter.actualizarPassword(valor);
  }

  protected onTelefonoChange(valor: string): void {
    this.presenter.actualizarTelefono(valor);
  }

  protected onDireccionChange(valor: string): void {
    this.presenter.actualizarDireccion(valor);
  }

  protected onTipoUsuarioChange(tipo: TipoUsuario): void {
    this.presenter.seleccionarTipoUsuario(tipo);
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
