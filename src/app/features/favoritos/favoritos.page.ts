import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { FavoritosService } from './services/favoritos.service';
import { UsuarioService } from '../../data-access/services/usuario.service';
import { PerfilService } from '../../data-access/services/perfil.service';
import { CarritoService } from '../compra/services/carrito.service';
import { ToastService } from '../../shared/services/toast.service';
import { Producto } from '../buffet/models/producto.model';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

@Component({
  selector: 'app-favoritos-page',
  templateUrl: './favoritos.page.html',
  styleUrl: './favoritos.page.css',
  imports: [NavbarComponent],
})
export class FavoritosPage {
  private readonly favoritosService = inject(FavoritosService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly carritoService = inject(CarritoService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  favoritos: Producto[] = [];
  alumnoId = '';

  readonly IMAGEN_FALLBACK =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 140'>
        <rect width='200' height='140' fill='#E8EDF3'/>
        <g fill='#94A3B8' transform='translate(72 38)'>
          <path d='M28 8c-11 0-20 9-20 20s9 20 20 20 20-9 20-20S39 8 28 8zm0 6a14 14 0 110 28 14 14 0 010-28z'/>
        </g>
        <text x='100' y='110' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='600' fill='#94A3B8'>Sin imagen</text>
      </svg>`,
    );

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === this.IMAGEN_FALLBACK) return;
    img.src = this.IMAGEN_FALLBACK;
  }

  constructor() {
    this.usuarioService.setHomeUrl('/alumno');
    this.alumnoId = this.perfilService.obtenerAlumnoId() ?? this.usuarioService.getAlumnoActual().id;

    this.cargarFavoritos();
  }

  cargarFavoritos(): void {
    this.favoritosService.getFavoritos(this.alumnoId).subscribe({
      next: (data) => {
        this.favoritos = data;
      },
      error: (err) => {
        console.error('Error al cargar favoritos:', err);
      }
    });
  }

  quitarFavorito(productoId: string): void {
    this.favoritosService.removerFavorito(this.alumnoId, productoId).subscribe({
      next: () => {
        this.favoritos = this.favoritos.filter((p) => p.id !== productoId);
        this.toastService.mostrar('Producto quitado de favoritos', 'success');
      },
      error: (err) => console.error('Error al quitar favorito:', err)
    });
  }

  agregarAlCarrito(producto: Producto): void {
    this.carritoService.agregar(producto, this.alumnoId, 1);
    this.toastService.mostrar(`Se agregó 1x "${producto.nombre}" al carrito`);
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(precio);
  }

  volver(): void {
    this.router.navigateByUrl('/alumno');
  }
}
