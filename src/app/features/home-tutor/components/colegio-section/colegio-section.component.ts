import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Alumno } from '../../../../data-access/models/alumno.model';
import { Colegio } from '../../../../data-access/models/colegio.model';
import { AlumnoCardComponent } from '../alumno-card/alumno-card.component';

@Component({
  selector: 'app-colegio-section',
  templateUrl: './colegio-section.component.html',
  styleUrl: './colegio-section.component.css',
  imports: [AlumnoCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColegioSectionComponent {
  @Input({ required: true }) colegio!: Colegio;
  @Input({ required: true }) alumnos!: Alumno[];
}
