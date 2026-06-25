import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { RestriccionesNutricionalesPresenter } from './presenter/restricciones-nutricionales.presenter';

@Component({
  selector: 'app-restricciones-nutricionales-page',
  templateUrl: './restricciones-nutricionales.page.html',
  styleUrl: './restricciones-nutricionales.page.css',
  imports: [],
  providers: [RestriccionesNutricionalesPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestriccionesNutricionalesPage {
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  protected readonly presenter = inject(RestriccionesNutricionalesPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;
  protected readonly esPremium = computed(() => !this.perfilService.esPlanGratuito());

  constructor() {
    effect(() => {
      const alumnoId = this.contextoService.alumnoId();
      void this.presenter.init(alumnoId);
    });
  }
}
