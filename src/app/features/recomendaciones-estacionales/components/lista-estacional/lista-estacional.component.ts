import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sugerencia } from '../../models/recomendacion.model';
import { TarjetaRecomendacionComponent } from '../tarjeta-recomendacion/tarjeta-recomendacion.component';
import { TarjetaTipComponent } from '../tarjeta-tip/tarjeta-tip.component';

@Component({
  selector: 'app-seasonal-list',
  standalone: true,
  imports: [CommonModule, TarjetaTipComponent, TarjetaRecomendacionComponent],
  templateUrl: './lista-estacional.component.html',
  styleUrls: ['./lista-estacional.component.css']
})
export class ListaEstacionalComponent {
  @Input({ required: true }) sugerencias: Sugerencia[] = [];
  @Input() tipPromocional: string | null = null;
  @Input() hasTipAction = false;
  @Input() tipActionText = '';
  @Input() tipActionIcon = '';

  @Output() tipActionClick = new EventEmitter<void>();

  onTipActionClick(): void {
    this.tipActionClick.emit();
  }
}
