import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CtaLanding } from '../models/cta-landing.model';

@Injectable()
export class LandingPresenter {
  private readonly router = inject(Router);

  readonly ctas: readonly CtaLanding[] = [
    { texto: 'Iniciar sesión', ruta: '/login', variante: 'primario' },
    { texto: 'Registrarme', ruta: '/registro', variante: 'secundario' },
  ];

  navegar(cta: CtaLanding): void {
    this.router.navigateByUrl(cta.ruta);
  }
}
