import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { SugerenciasService } from '../../features/sugerencias/services/sugerencias.service';

import { SugerenciaProducto } from '../../features/sugerencias/models/sugerencia-producto.model';

import { SugerenciaCardComponent } from './components/sugerencia-card/sugerencia-card.component';

@Component({
  selector: 'app-sugerencias-page',
  standalone: true,
  templateUrl: './sugerencias.page.html',
  styleUrl: './sugerencias.page.css',
  imports: [NavbarComponent, SugerenciaCardComponent],
})
export class SugerenciasPage {
  private readonly usuarioService = inject(UsuarioService);
  private readonly sugerenciasService = inject(SugerenciasService);
  private readonly router = inject(Router);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  readonly usuarioId = this.usuarioService.getUsuarioActual().id;

  sugerencias: SugerenciaProducto[] = [];

  constructor() {
    this.usuarioService.setHomeUrl('/kiosquero');

    const perfilRaw = localStorage.getItem('recred.perfil');

    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;

    if (usuarioId) {
      this.sugerenciasService.getSugerencias(usuarioId).subscribe((data) => {
        this.sugerencias = data;
      });
    }
  }

  volver(): void {
    this.router.navigateByUrl('/kiosquero');
  }
}
