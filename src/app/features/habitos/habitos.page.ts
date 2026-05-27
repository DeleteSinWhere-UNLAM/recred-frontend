import { Component, inject } from '@angular/core';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

import { UsuarioService } from '../../data-access/services/usuario.service';
import { HabitosService } from '../../data-access/services/habitos.service';

import { HabitoAlerta } from '../../data-access/models/habito-alerta.model';

import { HabitoAlertCardComponent } from './components/habito-alert-card/habito-alert-card.component';

@Component({
  selector: 'app-habitos-page',
  templateUrl: './habitos.page.html',
  styleUrl: './habitos.page.css',
  imports: [
    NavbarComponent,
    HabitoAlertCardComponent
  ]
})
export class HabitosPage {

  private readonly usuarioService =
    inject(UsuarioService);

  private readonly habitosService =
    inject(HabitosService);

  readonly nombreUsuario =
    this.usuarioService.getUsuarioActual().nombre;

  readonly alertas: HabitoAlerta[] =
    this.habitosService.getAlertas();

}