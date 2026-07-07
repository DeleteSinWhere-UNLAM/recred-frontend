import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { } from '../../shared/components/navbar/navbar.component';
import { PrediccionCardComponent } from './components/prediccion-card/prediccion-card.component';
import { TendenciaCardComponent } from './components/tendencia-card/tendencia-card.component';
import { EstadisticaPresenter } from './presenter/estadistica.presenter';

@Component({
  selector: 'app-estadistica-page',
  templateUrl: './estadistica.page.html',
  styleUrl: './estadistica.page.css',
  imports: [ PrediccionCardComponent, TendenciaCardComponent],
  providers: [EstadisticaPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadisticaPage {
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(EstadisticaPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  constructor() {
    effect(() => {
      const alumnoId = this.contextoService.alumnoId();
      this.presenter.init(alumnoId);
    });
  }
}
