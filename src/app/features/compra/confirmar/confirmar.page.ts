import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { } from '../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import {
  ResumenLinea,
  ResumenOrdenCardComponent,
} from '../components/resumen-orden-card/resumen-orden-card.component';
import { ConfirmarPresenter } from './presenter/confirmar.presenter';

const formateadorPrecio = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-confirmar-page',
  templateUrl: './confirmar.page.html',
  styleUrl: './confirmar.page.css',
  imports: [ ResumenOrdenCardComponent],
  providers: [ConfirmarPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmarPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  protected readonly presenter = inject(ConfirmarPresenter);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;

  protected readonly lineas = computed<ResumenLinea[]>(() =>
    this.presenter.ordenes().map((o) => ({
      alumnoId: o.alumno.id,
      nombre: `${o.alumno.nombre} ${o.alumno.apellido}`,
      subtotal: o.subtotal,
      incluido: true,
    })),
  );

  ngOnInit(): void {
    if (this.presenter.vacia()) {
      this.router.navigateByUrl('/compra');
    }
  }

  protected formatear(valor: number): string {
    return formateadorPrecio.format(valor);
  }
}
