import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Alumno } from '../../data-access/models/alumno.model';
import { Colegio } from '../../data-access/models/colegio.model';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ColegioSectionComponent } from './components/colegio-section/colegio-section.component';

interface GrupoColegio {
  colegio: Colegio;
  alumnos: Alumno[];
}

@Component({
  selector: 'app-home-padre-page',
  templateUrl: './home-padre.page.html',
  styleUrl: './home-padre.page.css',
  imports: [NavbarComponent, ColegioSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePadrePage {
  private readonly usuarioService = inject(UsuarioService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly alumnosService = inject(AlumnosService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;
  readonly grupos: GrupoColegio[] = this.armarGrupos();

  constructor() {
    this.usuarioService.setHomeUrl('/padre');
    this.usuarioService.setNombreNavbar(this.nombreUsuario);
  }

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
