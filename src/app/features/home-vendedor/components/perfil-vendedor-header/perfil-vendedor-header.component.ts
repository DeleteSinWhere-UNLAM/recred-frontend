import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-perfil-vendedor-header',
  templateUrl: './perfil-vendedor-header.component.html',
  styleUrl: './perfil-vendedor-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilVendedorHeaderComponent {
  @Input({ required: true }) iniciales!: string;
  @Input({ required: true }) nombreVendedor!: string;
  @Input({ required: true }) saludo!: string;
  @Input({ required: true }) gananciasFormateadas!: string;
  @Input({ required: true }) ventasHoy!: number;
  @Input({ required: true }) productosSinStock!: number;
}
