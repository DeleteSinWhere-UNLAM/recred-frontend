import { Component, Input } from '@angular/core';

import { HabitoAlerta } from '../../../../data-access/models/habito-alerta.model';

@Component({
  selector: 'app-habito-alert-card',
  templateUrl: './habito-alert-card.component.html',
  styleUrl: './habito-alert-card.component.css',
})
export class HabitoAlertCardComponent {

  @Input({ required: true })
  alerta!: HabitoAlerta;

}