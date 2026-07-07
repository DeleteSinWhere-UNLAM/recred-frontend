import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Preferencia } from '../../models/preferencia.model';
import { Producto } from '../../../buffet/models/producto.model';
import { FavoritosService } from '../../../favoritos/services/favoritos.service';

@Component({
  selector: 'app-preferencia-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preferencia-card.component.html',
  styleUrl: './preferencia-card.component.css',
})
export class PreferenciaCardComponent {

  @Input({ required: true })
  preferencia!: Preferencia;

  @Input() 
  alumnoId?: string;

  private readonly favoritosService = inject(FavoritosService);

  readonly IMAGEN_FALLBACK =
    'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';

  isAdding = false;

  get imagenProducto(): string {
    return this.preferencia.productoImagen || 
           (this.preferencia.productoNombre ? this.favoritosService.obtenerImagenProducto(this.preferencia.productoNombre) : '');
  }

  onImagenError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src === this.IMAGEN_FALLBACK) return;
    img.src = this.IMAGEN_FALLBACK;
  }

  agregarAFavoritos(): void {
    if (!this.alumnoId || !this.preferencia.productoId) return;

    this.isAdding = true;

    const dummyProducto: Producto = {
      id: this.preferencia.productoId,
      nombre: this.preferencia.productoNombre || 'Producto',
      precio: this.preferencia.productoPrecio || 0,
      descripcion: '',
      categoria: { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: [],
      imagen: this.preferencia.productoImagen || '',
      estadoStock: 'DISPONIBLE'
    };

    this.favoritosService.agregarFavorito(this.alumnoId, dummyProducto).subscribe({
      next: () => {
        this.isAdding = false;
        alert('¡Añadido a favoritos!');
      },
      error: () => {
        this.isAdding = false;
        alert('Error al añadir a favoritos');
      }
    });
  }
}
