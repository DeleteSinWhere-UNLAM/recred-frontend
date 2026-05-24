import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Alumno } from '../../core/models/alumno.model';
import { Colegio } from '../../core/models/colegio.model';
import { AlumnosService } from '../../core/services/alumnos.service';
import { ColegiosService } from '../../core/services/colegios.service';
import { UsuarioService } from '../../core/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ColegioSectionComponent } from './components/colegio-section/colegio-section.component';

interface GrupoColegio {
  colegio: Colegio;
  alumnos: Alumno[];
}

@Component({
  selector: 'app-home-page',
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  imports: [NavbarComponent, ColegioSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  private readonly usuarioService = inject(UsuarioService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly alumnosService = inject(AlumnosService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;
  readonly grupos: GrupoColegio[] = this.armarGrupos();

  private armarGrupos(): GrupoColegio[] {
    const alumnos = this.alumnosService.getAlumnos();
    return this.colegiosService
      .getColegios()
      .map((colegio) => ({
        colegio,
        alumnos: alumnos.filter((alumno) => alumno.colegioId === colegio.id),
      }))
      .filter((grupo) => grupo.alumnos.length > 0);
  }
}
