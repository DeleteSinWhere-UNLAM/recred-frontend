import { Injectable, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/services/auth.service';
import { CtaLanding } from '../models/cta-landing.model';

@Injectable()
export class LandingPresenter {
  private readonly authService = inject(AuthService);

  readonly ctas: readonly CtaLanding[] = [
    { texto: 'Iniciar sesión', ruta: 'login', variante: 'primario' },
    { texto: 'Registrar institución', ruta: 'registro-colegio', variante: 'secundario' },
  ];

  async iniciarLogin(): Promise<void> {
    await this.authService.login();
  }
}
