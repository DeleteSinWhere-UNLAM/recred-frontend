import { Component, inject } from '@angular/core';

import { } from '../../shared/components/navbar/navbar.component';

import { UsuarioService } from '../../data-access/services/usuario.service';

import { PreferenciaDetectada } from './models/preferencia-detectada.model';
import { PreferenciasDetectadasService } from './services/preferencias-detectadas.service';

import { PreferenciaDetectadaCardComponent } from './components/preferencia-detectada-card/preferencia-detectada-card.component';

@Component({
  selector: 'app-preferencias-detectadas-page',
  standalone: true,
  templateUrl: './preferencias-detectadas.page.html',
  styleUrl: './preferencias-detectadas.page.css',
  imports: [ PreferenciaDetectadaCardComponent],
})
export class PreferenciasDetectadasPage {
  private readonly usuarioService = inject(UsuarioService);

  private readonly preferenciasService = inject(PreferenciasDetectadasService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  preferencias: PreferenciaDetectada[] = [];

  constructor() {
    const perfilRaw = localStorage.getItem('recred.perfil');

    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;

    if (usuarioId) {
      this.preferenciasService.getPreferencias(usuarioId).subscribe((data) => {
        this.preferencias = data;

        console.log('PREFERENCIAS DETECTADAS:', data);
      });
    }
  }
}
