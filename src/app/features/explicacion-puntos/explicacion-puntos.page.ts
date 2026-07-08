import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-explicacion-puntos',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './explicacion-puntos.page.html',
  styleUrl: './explicacion-puntos.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExplicacionPuntosPage {
  private readonly router = inject(Router);

  volverAlHome(): void {
    void this.router.navigate(['/alumno']);
  }
}
