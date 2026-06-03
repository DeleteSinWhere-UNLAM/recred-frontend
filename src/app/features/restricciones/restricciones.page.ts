import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { RestriccionesPresenter } from './presenter/restricciones.presenter';

@Component({
  selector: 'app-restricciones-page',
  templateUrl: './restricciones.page.html',
  styleUrl: './restricciones.page.css',
  imports: [NavbarComponent],
  providers: [RestriccionesPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestriccionesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(RestriccionesPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    void this.presenter.init(alumnoId);
  }
}
