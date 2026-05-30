import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PedidoEnCurso } from '../../models/pedido-en-curso.model';
import { Recreo } from '../../models/recreo.model';

@Component({
  selector: 'app-pedido-recreo-card',
  templateUrl: './pedido-recreo-card.component.html',
  styleUrl: './pedido-recreo-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoRecreoCardComponent {
  @Input() pedido: PedidoEnCurso | undefined;
  @Input() recreo: Recreo | undefined;
  @Input({ required: true }) estadoLabel = '';
  @Input({ required: true }) iconoEstado = 'fa-utensils';
  @Output() verPedido = new EventEmitter<void>();

  protected get tienePedido(): boolean {
    return this.pedido !== undefined;
  }

  protected onCta(): void {
    this.verPedido.emit();
  }
}
