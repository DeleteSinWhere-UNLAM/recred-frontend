import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritosService } from '../favoritos/services/favoritos.service';
import { AlumnoContextoService } from '../../core/services/alumno-contexto.service';
import { AlumnosService } from '../../data-access/services/alumnos.service';
import { Producto } from '../buffet/models/producto.model';
import { Alumno } from '../../data-access/models/alumno.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-favoritos-alumno-page',
  templateUrl: './favoritos-alumno.page.html',
  styleUrl: './favoritos-alumno.page.css',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritosAlumnoPage {
  private readonly favoritosService = inject(FavoritosService);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly router = inject(Router);

  readonly cargando = signal(true);
  readonly favoritos = signal<Producto[]>([]);
  readonly alumno = signal<Alumno | null>(null);

  constructor() {
    // Reacciona cada vez que cambia el alumnoId (incluso si la ruta es la misma)
    effect(() => {
      const alumnoId = this.contextoService.alumnoId();
      if (!alumnoId) {
        void this.router.navigate(['/tutor']);
        return;
      }

      const encontrado = this.alumnosService.alumnos().find(a => a.id === alumnoId) ?? null;
      this.alumno.set(encontrado);
      this.cargando.set(true);
      this.favoritos.set([]);

      this.favoritosService.getFavoritos(alumnoId).subscribe({
        next: (favs) => {
          this.favoritos.set(favs || []);
          this.cargando.set(false);
        },
        error: () => {
          this.favoritos.set([]);
          this.cargando.set(false);
        }
      });
    });
  }

  volver(): void {
    void this.router.navigate(['/tutor']);
  }

  get nombreAlumno(): string {
    const nombre = this.alumno()?.nombre ?? '';
    return nombre.split(' ')[0] || 'alumno';
  }

  formatARS(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(precio);
  }

  readonly IMAGEN_FALLBACK =
    'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === this.IMAGEN_FALLBACK) return;
    img.src = this.IMAGEN_FALLBACK;
  }
}
