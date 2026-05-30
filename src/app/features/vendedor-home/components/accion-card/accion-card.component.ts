import { Component, Input } from '@angular/core';

import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-accion-card',
  standalone: true,
  templateUrl: './accion-card.component.html',
  styleUrl: './accion-card.component.css',
  imports: [RouterLink]
})
export class AccionCardComponent {

  @Input({ required: true })
  titulo!: string;

  @Input({ required: true })
  icono!: string;

  @Input({ required: true })
  ruta!: string;

}