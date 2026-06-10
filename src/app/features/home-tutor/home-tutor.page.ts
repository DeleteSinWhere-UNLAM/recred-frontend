import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [
    NavbarComponent,
    ColegioSectionComponent,
    TutorHeaderComponent,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeTutorPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly alumnosService = inject(AlumnosService);

  private readonly perfil = this.perfilService.getPerfil();
  private readonly alumnos = this.alumnosService.alumnos;

  readonly nombreUsuario = this.perfil?.nombre ?? this.usuarioService.getUsuarioActual().nombre;
  readonly nombreCompletoTutor = this.armarNombreCompleto();
  readonly inicialesTutor = this.armarIniciales();

  readonly grupos = computed<GrupoColegio[]>(() => {
    const alumnos = this.alumnos();
    const colegios = this.colegiosService.getColegios();
    const porColegio = new Map<string, GrupoColegio>();
    for (const alumno of alumnos) {
      const id = alumno.colegioId || 'sin-colegio';
      let grupo = porColegio.get(id);
      if (!grupo) {
        const conocido = colegios.find((c) => c.id === id);
        grupo = {
          colegio: conocido ?? { id, nombre: 'Mi colegio' },
          alumnos: [],
        };
        porColegio.set(id, grupo);
      }
      grupo.alumnos.push(alumno);
    }
    return Array.from(porColegio.values());
  });

  readonly cantidadHijos = computed(() => this.alumnos().length);
  readonly cantidadColegios = computed(() => this.grupos().length);
  readonly saldoTotal = computed(() => this.alumnos().reduce((sum, a) => sum + a.saldo, 0));
  readonly saldoTotalFormateado = computed(() => formateadorSaldo.format(this.saldoTotal()));
  readonly saldoTotalNegativo = computed(() => this.saldoTotal() < 0);

  constructor() {
    this.usuarioService.setHomeUrl('/tutor');
    this.usuarioService.setNombreNavbar(this.nombreUsuario);
  }

  ngOnInit(): void {
    void this.alumnosService.asegurarCargados();
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
}
