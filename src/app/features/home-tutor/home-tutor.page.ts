import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Alumno } from '../../data-access/models/alumno.model';
import { Colegio } from '../../data-access/models/colegio.model';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { ColegiosService } from '../../data-access/services/colegios.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ColegioSectionComponent } from './components/colegio-section/colegio-section.component';
import { TutorHeaderComponent } from './components/tutor-header/tutor-header.component';

interface GrupoColegio {
  colegio: Colegio;
  alumnos: Alumno[];
}

const formateadorSaldo = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

@Component({
  selector: 'app-home-tutor-page',
  templateUrl: './home-tutor.page.html',
  styleUrl: './home-tutor.page.css',
  imports: [NavbarComponent, ColegioSectionComponent, TutorHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeTutorPage {
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly alumnosService = inject(AlumnosService);

  private readonly perfil = this.perfilService.getPerfil();
  private readonly alumnos = this.alumnosService.getAlumnos();

  readonly nombreUsuario = this.perfil?.nombre ?? this.usuarioService.getUsuarioActual().nombre;
  readonly nombreCompletoTutor = this.armarNombreCompleto();
  readonly inicialesTutor = this.armarIniciales();
  readonly grupos: GrupoColegio[] = this.armarGrupos();
  readonly cantidadHijos = this.alumnos.length;
  readonly cantidadColegios = this.grupos.length;
  readonly saldoTotal = this.alumnos.reduce((sum, a) => sum + a.saldo, 0);
  readonly saldoTotalFormateado = formateadorSaldo.format(this.saldoTotal);
  readonly saldoTotalNegativo = this.saldoTotal < 0;

  constructor() {
    this.usuarioService.setHomeUrl('/tutor');
    this.usuarioService.setNombreNavbar(this.nombreUsuario);
  }

  private armarNombreCompleto(): string {
    if (this.perfil) {
      return `${this.perfil.nombre} ${this.perfil.apellido}`.trim();
    }
    return this.nombreUsuario;
  }

  private armarIniciales(): string {
    const nombre = this.perfil?.nombre ?? this.nombreUsuario;
    const apellido = this.perfil?.apellido ?? '';
    const ini = (nombre[0] ?? '') + (apellido[0] ?? '');
    return ini.toUpperCase();
  }

  private armarGrupos(): GrupoColegio[] {
    return this.colegiosService
      .getColegios()
      .map((colegio) => ({
        colegio,
        alumnos: this.alumnos.filter((alumno) => alumno.colegioId === colegio.id),
      }))
      .filter((grupo) => grupo.alumnos.length > 0);
  }
}
