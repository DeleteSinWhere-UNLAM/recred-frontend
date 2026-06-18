import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { HomeKiosqueroPresenter } from './presenter/home-kiosquero.presenter';

const IMAGEN_FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'>
      <rect width='200' height='140' fill='#E8EDF3'/>
      <g fill='#94A3B8' transform='translate(72 38)'>
        <path d='M28 8c-11 0-20 9-20 20s9 20 20 20 20-9 20-20S39 8 28 8zm0 6a14 14 0 110 28 14 14 0 010-28z'/>
      </g>
      <text x='100' y='110' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='600' fill='#94A3B8'>Sin imagen</text>
    </svg>`,
  );

@Component({
  selector: 'app-home-kiosquero-page',
  templateUrl: './home-kiosquero.page.html',
  styleUrl: './home-kiosquero.page.css',
  imports: [NavbarComponent],
  providers: [HomeKiosqueroPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeKiosqueroPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(HomeKiosqueroPresenter);

  protected readonly IMAGEN_FALLBACK = IMAGEN_FALLBACK;

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');
    this.presenter.init();
  }

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === IMAGEN_FALLBACK) return;
    img.src = IMAGEN_FALLBACK;
  }
}
