import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-perfil-kiosquero-header',
  templateUrl: './perfil-kiosquero-header.component.html',
  styleUrl: './perfil-kiosquero-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilKiosqueroHeaderComponent {
  @Input({ required: true }) iniciales!: string;
  @Input({ required: true }) nombreKiosquero!: string;
  @Input({ required: true }) saludo!: string;
  @Input({ required: true }) gananciasFormateadas!: string;
  @Input({ required: true }) ventasHoy!: number;
  @Input({ required: true }) productosSinStock!: number;
}
