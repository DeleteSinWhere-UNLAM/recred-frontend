import { Component, Input } from '@angular/core';
import { Preferencia } from '../../models/preferencia.model';

@Component({
  selector: 'app-preferencia-card',
  templateUrl: './preferencia-card.component.html',
  styleUrl: './preferencia-card.component.css',
})
export class PreferenciaCardComponent {

  @Input({ required: true })
  preferencia!: Preferencia;

}
