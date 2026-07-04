import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';
import { AuthService } from '../../core/auth/services/auth.service';
import { RolUsuario } from '../../data-access/models/perfil.model';
import { AlumnosService } from '../../data-access/services/alumnos.service';
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
  ADMIN: '/recred-admin',
};

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.css',
  imports: [LandingCtaButtonComponent],
  providers: [LandingPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage implements OnInit, OnDestroy {
  protected readonly presenter = inject(LandingPresenter);
  private readonly authService = inject(AuthService);
  private readonly perfilService = inject(PerfilService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly router = inject(Router);

  protected readonly cargando = signal<boolean>(true);

  private hubUnsubscribe?: () => void;
  private redirigiendo = false;

  async ngOnInit(): Promise<void> {
    this.hubUnsubscribe = Hub.listen('auth', async ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        await this.continuarLoginAutenticado();
      } else if (payload.event === 'signInWithRedirect_failure') {
        this.redirigiendo = false;
        this.cargando.set(false);
      }
    });

    const autenticado = await this.authService.isAutenticado();

    if (!autenticado) {
      this.cargando.set(false);
      return;
    }

    await this.continuarLoginAutenticado();
  }

  ngOnDestroy(): void {
    this.hubUnsubscribe?.();
  }

  private async redirigirSegunPerfil(): Promise<void> {
    try {
      const perfil = await this.perfilService.cargarPerfil();
      const destino = await this.resolverDestino(perfil.rol);
      this.router.navigateByUrl(destino);
    } catch (err) {
      if (err instanceof UsuarioSinPerfilError) {
        this.router.navigateByUrl('/seleccion-tipo-cuenta');
        return;
      }
      console.error('Error cargando perfil tras login', err);
      this.redirigiendo = false;

      this.cargando.set(false);
    }
  }

  private async resolverDestino(rol: RolUsuario): Promise<string> {
    if (rol !== 'PADRE') {
      return ROL_A_RUTA[rol];
    }
    try {
      const hijos = await this.alumnosService.cargarHijosDelTutor();
      return hijos.length === 0 ? '/crear-hijo' : '/tutor';
    } catch (err) {
      console.error('Error verificando hijos del tutor', err);
      return '/tutor';
    }
  }

  private async continuarLoginAutenticado(): Promise<void> {
    if (this.redirigiendo) return;

    this.redirigiendo = true;
    this.cargando.set(true);

    const autenticado = await this.authService.esperarAutenticacion();

    if (!autenticado) {
      this.redirigiendo = false;
      this.cargando.set(false);
      return;
    }

    await this.redirigirSegunPerfil();
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
