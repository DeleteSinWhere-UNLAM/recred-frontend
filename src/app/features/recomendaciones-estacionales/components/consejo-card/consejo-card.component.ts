import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consejo-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consejo-card.component.html',
  styleUrls: ['./consejo-card.component.css']
})
export class ConsejoCardComponent {
  @Input({ required: true }) tipPromocional!: string;
}
