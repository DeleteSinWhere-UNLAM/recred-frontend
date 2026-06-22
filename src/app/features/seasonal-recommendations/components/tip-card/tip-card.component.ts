import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tip-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tip-card.component.html',
  styleUrls: ['./tip-card.component.css']
})
export class TipCardComponent {
  @Input({ required: true }) tipPromocional!: string;
  @Input() hasAction = false;
  @Input() actionText = '';
  @Input() actionIcon = '';
  
  @Output() actionClick = new EventEmitter<void>();

  onActionClick(): void {
    this.actionClick.emit();
  }
}
