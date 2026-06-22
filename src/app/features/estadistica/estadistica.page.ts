import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { } from '../../shared/components/navbar/navbar.component';
import { PrediccionCardComponent } from './components/prediccion-card/prediccion-card.component';
import { EstadisticaPresenter } from './presenter/estadistica.presenter';

@Component({
  selector: 'app-estadistica-page',
  templateUrl: './estadistica.page.html',
  styleUrl: './estadistica.page.css',
  imports: [ PrediccionCardComponent],
  providers: [EstadisticaPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadisticaPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(EstadisticaPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    this.presenter.init(alumnoId);
  }
}
