import { Component, Input } from '@angular/core';

import { PreferenciaDetectada } from '../../models/preferencia-detectada.model';

@Component({
  selector: 'app-preferencia-detectada-card',
  standalone: true,
  templateUrl: './preferencia-detectada-card.component.html',
  styleUrl: './preferencia-detectada-card.component.css',
})
export class PreferenciaDetectadaCardComponent {
  @Input({ required: true })
  preferencia!: PreferenciaDetectada;

  expandido = false;

  toggleDetalle(): void {
    this.expandido = !this.expandido;
  }
}
