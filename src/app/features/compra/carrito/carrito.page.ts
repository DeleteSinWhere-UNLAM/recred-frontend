import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { OrdenAlumnoCardComponent } from '../components/orden-alumno-card/orden-alumno-card.component';
import {
  ResumenLinea,
  ResumenOrdenCardComponent,
} from '../components/resumen-orden-card/resumen-orden-card.component';
import { CarritoPresenter } from './presenter/carrito.presenter';

@Component({
  selector: 'app-carrito-page',
  templateUrl: './carrito.page.html',
  styleUrl: './carrito.page.css',
  imports: [NavbarComponent, OrdenAlumnoCardComponent, ResumenOrdenCardComponent],
  providers: [CarritoPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarritoPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(CarritoPresenter);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;

  ngOnInit(): void {
    this.presenter.init();
  }

  protected readonly lineasResumen = computed<ResumenLinea[]>(() =>
    this.presenter.grupos().map((g) => ({
      alumnoId: g.alumno.id,
      nombre: `${g.alumno.nombre} ${g.alumno.apellido}`,
      subtotal: g.subtotal,
      incluido: g.seleccionado,
    })),
  );
}
