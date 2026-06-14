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

  ngOnInit(): void {
    this.usuarioService.setHomeUrl('/kiosquero');
    this.presenter.initReportes();
  }

  protected volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }
}
