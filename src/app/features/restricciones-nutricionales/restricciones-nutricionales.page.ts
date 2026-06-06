import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { RestriccionesNutricionalesPresenter } from './presenter/restricciones-nutricionales.presenter';

@Component({
  selector: 'app-restricciones-nutricionales-page',
  templateUrl: './restricciones-nutricionales.page.html',
  styleUrl: './restricciones-nutricionales.page.css',
  imports: [NavbarComponent],
  providers: [RestriccionesNutricionalesPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestriccionesNutricionalesPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly usuarioService = inject(UsuarioService);
  protected readonly presenter = inject(RestriccionesNutricionalesPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  ngOnInit(): void {
    const alumnoId = this.route.snapshot.paramMap.get('alumnoId') ?? '';
    void this.presenter.init(alumnoId);
  }
}
