import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { CodigoRetiroCardComponent } from '../components/codigo-retiro-card/codigo-retiro-card.component';
import { ExitoPresenter } from './presenter/exito.presenter';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-exito-page',
  templateUrl: './exito.page.html',
  styleUrl: './exito.page.css',
  imports: [NavbarComponent, CodigoRetiroCardComponent],
  providers: [ExitoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExitoPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  protected readonly presenter = inject(ExitoPresenter);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;

  ngOnInit(): void {
    if (this.presenter.vacia()) {
      this.router.navigateByUrl(this.usuarioService.homeUrl());
    }
  }

  protected get totalFormateado(): string {
    return formateadorPrecio.format(this.presenter.total());
  }
}
