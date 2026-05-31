import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-perfil-header',
  templateUrl: './perfil-header.component.html',
  styleUrl: './perfil-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilHeaderComponent {
  @Input({ required: true }) iniciales = '';
  @Input({ required: true }) nombreCompleto = '';
  @Input({ required: true }) grado = '';
  @Input({ required: true }) colegio = '';
  @Input({ required: true }) saldoFormateado = '';
  @Input() saldoNegativo = false;
}
