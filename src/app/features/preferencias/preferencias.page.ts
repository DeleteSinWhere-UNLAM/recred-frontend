import { Component, inject } from '@angular/core';

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

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  preferencias: Preferencia[] = [];

  constructor() {
    const nombre = this.usuarioService.getUsuarioActual().nombre;
    console.log(nombre);

    this.preferenciasService.getPreferencias().subscribe((data) => {
      this.preferencias = data;
      console.log('PREFERENCIAS:', data);
    });
  }
}
