import { Component, Input } from '@angular/core';
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
}
