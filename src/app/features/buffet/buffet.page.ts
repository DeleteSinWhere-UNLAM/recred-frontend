import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../core/services/usuario.service';
import { ProductoCardComponent } from './components/producto-card/producto-card.component';
import { BuffetPresenter } from './presenter/buffet.presenter';

@Component({
  selector: 'app-buffet-page',
  templateUrl: './buffet.page.html',
  styleUrl: './buffet.page.css',
  imports: [NavbarComponent, ProductoCardComponent],
  providers: [BuffetPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuffetPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(BuffetPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    this.presenter.init(alumnoId);
  }

  protected onBusqueda(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.presenter.buscar(target.value);
  }

  protected onCategoria(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.seleccionarCategoria(target.value);
  }

  protected onClasificacion(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.presenter.seleccionarClasificacion(target.value);
  }

  protected get saldoFormateado(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(this.presenter.saldo());
  }
}
