import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-tutor-header',
  templateUrl: './tutor-header.component.html',
  styleUrl: './tutor-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorHeaderComponent {
  @Input({ required: true }) iniciales = '';
  @Input({ required: true }) nombreCompleto = '';
  @Input() urlFotoPerfil: string | null = null;
  @Input({ required: true }) cantidadHijos = 0;
  @Input({ required: true }) cantidadColegios = 0;
  @Input({ required: true }) saldoTotalFormateado = '';
  @Input() saldoTotalNegativo = false;

  get resumenHijos(): string {
    const hijosLabel = this.cantidadHijos === 1 ? 'hijo' : 'hijos';
    if (this.cantidadColegios <= 1) {
      return `${this.cantidadHijos} ${hijosLabel}`;
    }
    return `${this.cantidadHijos} ${hijosLabel} · ${this.cantidadColegios} colegios`;
  }
}
