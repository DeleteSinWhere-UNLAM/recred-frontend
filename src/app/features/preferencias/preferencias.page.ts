import { Component, effect, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';

import { Preferencia } from './models/preferencia.model';
import { PreferenciasService } from './services/preferencias.service';
import { UsuarioService } from '../../data-access/services/usuario.service';

import { PreferenciaCardComponent } from './components/preferencia-card/preferencia-card.component';
import { } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-preferencias-page',
  templateUrl: './preferencias.page.html',
  styleUrl: './preferencias.page.css',
  imports: [ PreferenciaCardComponent],
})
export class PreferenciasPage {
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  preferencias: Preferencia[] = [];

  get alumnoId(): string | undefined {
    return this.contextoService.alumnoId() || undefined;
  }

  constructor() {
    this.usuarioService.setHomeUrl('/tutor');

    effect(() => {
      const alumnoId = this.contextoService.alumnoId() || undefined;
      this.preferenciasService.getPreferencias(alumnoId).subscribe((data) => {
        this.preferencias = data ?? [];
        this.cdr.markForCheck();
      });
    });
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}
