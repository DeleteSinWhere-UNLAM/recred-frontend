import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-tip.component.html',
  styleUrls: ['./tarjeta-tip.component.css']
})
export class TarjetaTipComponent {
  @Input({ required: true }) tipPromocional!: string;
  @Input() hasAction = false;
  @Input() actionText = '';
  @Input() actionIcon = '';
  
  @Output() actionClick = new EventEmitter<void>();

  onActionClick(): void {
    this.actionClick.emit();
  }
}
