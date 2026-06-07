import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { Preferencia } from './models/preferencia.model';
import { PreferenciasService } from './services/preferencias.service';
import { UsuarioService } from '../../data-access/services/usuario.service';

import { PreferenciaCardComponent } from './components/preferencia-card/preferencia-card.component';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-preferencias-page',
  templateUrl: './preferencias.page.html',
  styleUrl: './preferencias.page.css',
  imports: [NavbarComponent, PreferenciaCardComponent],
})
export class PreferenciasPage {
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  preferencias: Preferencia[] = [];

  constructor() {
    this.usuarioService.setHomeUrl('/tutor');

    // Cargar sugerencias de la IA
    this.preferenciasService.getPreferencias().subscribe((data) => {
      this.preferencias = data;
    });
  }

  volver(): void {
    this.router.navigateByUrl('/tutor');
  }
}
