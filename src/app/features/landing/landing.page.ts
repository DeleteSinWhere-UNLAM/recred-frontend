import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/services/auth.service';
import { RolUsuario } from '../../data-access/models/perfil.model';
import {
  PerfilService,
  UsuarioSinPerfilError,
} from '../../data-access/services/perfil.service';
import { LandingCtaButtonComponent } from './components/landing-cta-button/landing-cta-button.component';
import { LandingPresenter } from './presenter/landing.presenter';

const ROL_A_RUTA: Record<RolUsuario, string> = {
  PADRE: '/tutor',
  ALUMNO: '/alumno',
  VENDEDOR: '/kiosquero',
};

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.css',
  imports: [LandingCtaButtonComponent],
  providers: [LandingPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage implements OnInit {
  protected readonly presenter = inject(LandingPresenter);
  private readonly authService = inject(AuthService);
  private readonly perfilService = inject(PerfilService);
  private readonly router = inject(Router);

  // 1. Agregamos el estado de carga (arranca asumiendo que estamos cargando)
  protected readonly cargando = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    const autenticado = await this.authService.isAutenticado();
    
    // Si no está autenticado, cortamos la carga y mostramos la Landing
    if (!autenticado) {
      this.cargando.set(false);
      return;
    }

    try {
      const perfil = await this.perfilService.cargarPerfil();
      this.router.navigateByUrl(ROL_A_RUTA[perfil.rol]);
    } catch (err) {
      if (err instanceof UsuarioSinPerfilError) {
        this.router.navigateByUrl('/seleccion-tipo-cuenta');
        return;
      }
      console.error('Error cargando perfil tras login', err);
      // Si hay un error grave, mostramos la Landing para que intente de nuevo
      this.cargando.set(false); 
    }
  }

  protected onCtaClick(): void {
    void this.presenter.iniciarLogin();
  }

  protected onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.endsWith(IMAGEN_FALLBACK)) return;
    img.src = IMAGEN_FALLBACK;
  }
}

const IMAGEN_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 540'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='#E8EDF3'/>
          <stop offset='1' stop-color='#F0F4F8'/>
        </linearGradient>
      </defs>
      <rect width='480' height='540' fill='url(#g)'/>
      <g transform='translate(140 180)' fill='#94A3B8'>
        <circle cx='40' cy='40' r='32'/>
        <rect x='90' y='10' width='110' height='60' rx='12'/>
        <rect x='30' y='100' width='170' height='50' rx='10' fill='#4A6FA5' opacity='0.25'/>
      </g>
      <text x='240' y='420' text-anchor='middle' font-family='Inter, sans-serif' font-size='16' font-weight='600' fill='#94A3B8'>
        Imagen del buffet
      </text>
    </svg>`,
  );
