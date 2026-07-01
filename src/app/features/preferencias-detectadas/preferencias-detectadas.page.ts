import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PreferenciaDetectadaCardComponent } from './components/preferencia-detectada-card/preferencia-detectada-card.component';
import { PreferenciasDetectadasPresenter } from './presenter/preferencias-detectadas.presenter';

@Component({
  selector: 'app-preferencias-detectadas-page',
  standalone: true,
  templateUrl: './preferencias-detectadas.page.html',
  styleUrl: './preferencias-detectadas.page.css',
  imports: [CommonModule, NavbarComponent, PreferenciaDetectadaCardComponent],
  providers: [PreferenciasDetectadasPresenter]
})
export class PreferenciasDetectadasPage implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  readonly presenter = inject(PreferenciasDetectadasPresenter);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual()?.nombre || '';

  ngOnInit(): void {
    this.presenter.initialize();
  }
}
