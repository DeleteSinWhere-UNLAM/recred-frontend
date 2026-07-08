import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StudentRewardStatus } from '../../../../data-access/models/student-reward-status.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-puntos-recompensa-bar',
  standalone: true,
  imports: [NgClass],
  templateUrl: './puntos-recompensa-bar.component.html',
  styleUrl: './puntos-recompensa-bar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PuntosRecompensaBarComponent {
  @Input({ required: true }) status!: StudentRewardStatus;

  private readonly router = inject(Router);

  irAExplicacionPuntos(): void {
    void this.router.navigate(['/puntos']);
  }
}
