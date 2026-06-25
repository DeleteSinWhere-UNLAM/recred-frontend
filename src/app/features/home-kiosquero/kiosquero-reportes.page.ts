import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';

@Component({
  selector: 'app-kiosquero-reportes-page',
  templateUrl: './kiosquero-reportes.page.html',
  styleUrl: './kiosquero-reportes.page.css',
  imports: [NavbarComponent],
  providers: [HomeKiosqueroPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KiosqueroReportesPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  protected readonly presenter = inject(HomeKiosqueroPresenter);

  protected readonly IMAGEN_FALLBACK = IMAGEN_FALLBACK;

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');
    this.presenter.initReportes();
  }

  protected volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === IMAGEN_FALLBACK) return;
    img.src = IMAGEN_FALLBACK;
  }
}

const IMAGEN_FALLBACK =
  'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
