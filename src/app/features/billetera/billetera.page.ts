import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { PerfilService } from '../../data-access/services/perfil.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { BilleteraPresenter, RangoFecha } from './presenter/billetera.presenter';

@Component({
  selector: 'app-billetera-page',
  templateUrl: './billetera.page.html',
  styleUrl: './billetera.page.css',
  imports: [CommonModule, NavbarComponent],
  providers: [BilleteraPresenter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BilleteraPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  protected readonly presenter = inject(BilleteraPresenter);

  readonly nombreUsuario = this.usuarioService.nombreNavbar;
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;

  ngOnInit(): void {
    this.sincronizarVistaActual();
    this.presenter.init(this.contextoService.alumnoId() || null);
  }

  protected cambiarFecha(rango: RangoFecha): void {
    this.presenter.cambiarFecha(rango);
  }

  protected onDesdeChange(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.presenter.setearRango(valor, this.presenter.hasta());
  }

  protected onHastaChange(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.presenter.setearRango(this.presenter.desde(), valor);
  }

  private sincronizarVistaActual(): void {
    const rol = this.perfilService.rol();
    if (rol === 'ALUMNO') {
      this.usuarioService.setHomeUrl('/alumno');
    } else if (rol === 'PADRE') {
      this.usuarioService.setHomeUrl('/tutor');
    }
  }
}
