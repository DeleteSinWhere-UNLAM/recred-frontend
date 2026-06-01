import { Component, inject } from '@angular/core';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { ConsumoService } from './services/consumo.service';

import { ConsumoAprendizaje } from './models/consumo-aprendizaje.model';

import { ConsumoCardComponent } from './components/consumo-card/consumo-card.component';

@Component({
  selector: 'app-consumo-page',
  templateUrl: './consumo.page.html',
  styleUrl: './consumo.page.css',
  imports: [NavbarComponent, ConsumoCardComponent]
})
export class ConsumoPage {

  private readonly usuarioService =
    inject(UsuarioService);

  private readonly consumoService =
    inject(ConsumoService);

  readonly nombreUsuario =
    this.usuarioService.getUsuarioActual().nombre;

  readonly consumos: ConsumoAprendizaje[] =
    this.consumoService.getConsumos();

}
