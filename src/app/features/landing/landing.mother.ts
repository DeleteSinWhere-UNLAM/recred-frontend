import { CtaLanding } from './models/cta-landing.model';

export class CtaLandingMother {
  static crear(override: Partial<CtaLanding> = {}): CtaLanding {
    return {
      texto: 'Iniciar sesión',
      ruta: 'login',
      variante: 'primario',
      ...override,
    };
  }

  static crearPrimario(override: Partial<CtaLanding> = {}): CtaLanding {
    return CtaLandingMother.crear({ texto: 'Iniciar sesión', ruta: 'login', variante: 'primario', ...override });
  }

  static crearSecundario(override: Partial<CtaLanding> = {}): CtaLanding {
    return CtaLandingMother.crear({ texto: 'Registrar institución', ruta: 'registro-colegio', variante: 'secundario', ...override });
  }

  static crearLista(): readonly CtaLanding[] {
    return [CtaLandingMother.crearPrimario(), CtaLandingMother.crearSecundario()];
  }
}
