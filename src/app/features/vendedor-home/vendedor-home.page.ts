import { Component, inject } from '@angular/core';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

import { UsuarioService } from '../../data-access/services/usuario.service';

import { VendedorHomeService } from '../../data-access/services/vendedor-home.service';

import { AccionCardComponent } from './components/accion-card/accion-card.component';

import { EstadisticaCardComponent } from './components/estadisticas-card/estadisticas-card.component';

@Component({
  selector: 'app-vendedor-home-page',
  standalone: true,
  templateUrl: './vendedor-home.page.html',
  styleUrl: './vendedor-home.page.css',
  imports: [
    NavbarComponent,
    AccionCardComponent,
    EstadisticaCardComponent
  ]
})
export class VendedorHomePage {

  private readonly usuarioService =
    inject(UsuarioService);

  private readonly vendedorHomeService =
    inject(VendedorHomeService);

  readonly nombreUsuario =
    this.usuarioService
      .getUsuarioActual()
      .nombre;

  readonly resumen =
    this.vendedorHomeService
      .getResumen();

}