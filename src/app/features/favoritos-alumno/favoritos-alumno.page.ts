import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { FavoritosService } from '../favoritos/services/favoritos.service';
import { BuffetService } from '../buffet/services/buffet.service';
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
  private readonly buffetService = inject(BuffetService);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly router = inject(Router);

  readonly cargando = signal(true);
  readonly favoritos = signal<Producto[]>([]);
  readonly alumno = signal<Alumno | null>(null);

  constructor() {
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

      this.favoritosService.getFavoritos(alumnoId).pipe(
        switchMap(favs => {
          const favoritos = favs || [];
          return forkJoin({
            favoritos: of(favoritos),
            buffet: this.buffetService.obtenerBuffetDelAlumno(alumnoId).pipe(
              switchMap(buffet =>
                this.buffetService.getProductosDelBuffet(buffet.id, alumnoId)
              ),
              catchError(() => of([] as Producto[]))
            )
          });
        }),
        catchError(() => of({ favoritos: [] as Producto[], buffet: [] as Producto[] }))
      ).subscribe(({ favoritos, buffet }) => {
        const buffetMap = new Map<string, Producto>(
          buffet.map(p => [p.id, p])
        );

        const enriquecidos = favoritos.map(fav => {
          const buffetProd = buffetMap.get(fav.id);
          return {
            ...fav,
            imagen: buffetProd?.imagen || fav.imagen || '',
            estadoStock: buffetProd ? buffetProd.estadoStock : fav.estadoStock
          };
        });

        this.favoritos.set(enriquecidos);
        this.cargando.set(false);
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
