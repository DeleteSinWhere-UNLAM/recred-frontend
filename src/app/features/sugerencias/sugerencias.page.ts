import { Component, inject } from '@angular/core';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { SugerenciasService } from './services/sugerencias.service';

import { SugerenciaProducto } from './models/sugerencia-producto.model';

import { SugerenciaCardComponent } from './components/sugerencia-card/sugerencia-card.component';

@Component({
  selector: 'app-sugerencias-page',
  templateUrl: './sugerencias.page.html',
  styleUrl: './sugerencias.page.css',
  imports: [NavbarComponent, SugerenciaCardComponent]
})
export class SugerenciasPage {

  private readonly usuarioService =
    inject(UsuarioService);

  private readonly sugerenciasService =
    inject(SugerenciasService);

  readonly nombreUsuario =
    this.usuarioService.getUsuarioActual().nombre;

  readonly sugerencias: SugerenciaProducto[] =
    this.sugerenciasService.getSugerencias();
}
