import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Producto } from '../../buffet/models/producto.model';

interface ProductDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  urlImagen?: string | null;
  stockActual?: number;
  categoria?: { id: string; descripcion: string } | null;
  clasificacionesSalud?: { id: string; descripcion: string }[] | null;
}

@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  private getPath(alumnoId: string): string {
    const perfil = this.perfilService.getPerfil();
    if (perfil && perfil.rol === 'ALUMNO' && perfil.id === alumnoId) {
      return `usuarios/${alumnoId}`;
    }
    return `alumnos/${alumnoId}`;
  }

  getFavoritos(alumnoId: string): Observable<Producto[]> {
    if (!this.isUuid(alumnoId)) {
      return of(this.getFavoritosFromLocalStorage(alumnoId));
    }

    const path = this.getPath(alumnoId);
    return this.http.get<ProductDTO[]>(`${environment.apiUrl}/${path}/preferencias/favoritos`).pipe(
      map(dtos => dtos.map(dto => this.mapDtoToProducto(dto))),
      catchError((error) => {
        console.warn('Error fetching favorites from backend, falling back to localStorage:', error);
        return of(this.getFavoritosFromLocalStorage(alumnoId));
      })
    );
  }

  agregarFavorito(alumnoId: string, producto: Producto): Observable<void> {
    if (!this.isUuid(alumnoId) || !this.isUuid(producto.id)) {
      this.saveFavoritoToLocalStorage(alumnoId, producto);
      return of(undefined);
    }

    const path = this.getPath(alumnoId);
    return this.http.post<void>(`${environment.apiUrl}/${path}/preferencias/favoritos/${producto.id}`, {}).pipe(
      catchError((error) => {
        console.warn('Error saving favorite to backend, saving to localStorage:', error);
        this.saveFavoritoToLocalStorage(alumnoId, producto);
        return of(undefined);
      })
    );
  }

  removerFavorito(alumnoId: string, productoId: string): Observable<void> {
    if (!this.isUuid(alumnoId) || !this.isUuid(productoId)) {
      this.removeFavoritoFromLocalStorage(alumnoId, productoId);
      return of(undefined);
    }

    const path = this.getPath(alumnoId);
    return this.http.delete<void>(`${environment.apiUrl}/${path}/preferencias/favoritos/${productoId}`).pipe(
      catchError((error) => {
        console.warn('Error removing favorite from backend, removing from localStorage:', error);
        this.removeFavoritoFromLocalStorage(alumnoId, productoId);
        return of(undefined);
      })
    );
  }

  private isUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  }

  private getFavoritosFromLocalStorage(alumnoId: string): Producto[] {
    const key = `recred.favoritos.${alumnoId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveFavoritoToLocalStorage(alumnoId: string, producto: Producto): void {
    const key = `recred.favoritos.${alumnoId}`;
    const current = this.getFavoritosFromLocalStorage(alumnoId);
    if (!current.some(p => p.id === producto.id)) {
      current.push(producto);
      localStorage.setItem(key, JSON.stringify(current));
    }
  }

  private removeFavoritoFromLocalStorage(alumnoId: string, productoId: string): void {
    const key = `recred.favoritos.${alumnoId}`;
    const current = this.getFavoritosFromLocalStorage(alumnoId);
    const updated = current.filter(p => p.id !== productoId);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  private mapDtoToProducto(dto: ProductDTO): Producto {
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? '',
      precio: dto.precio,
      categoria: dto.categoria ?? { id: 'comidas', descripcion: 'Comidas' },
      clasificacionesSalud: dto.clasificacionesSalud ?? [],
      imagen: dto.urlImagen || this.obtenerImagenProducto(dto.nombre),
      estadoStock: (dto.stockActual !== undefined ? dto.stockActual : 1) > 0 ? 'DISPONIBLE' : 'SIN_STOCK'
    };
  }

  obtenerImagenProducto(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('coca') || n.includes('gaseosa')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Coca-Cola_glass_bottle.jpg';
    }
    if (n.includes('agua')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Bottled_water.jpg';
    }
    if (n.includes('sandwich') || n.includes('tostado')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Ham_and_cheese_sandwich.jpg';
    }
    if (n.includes('empanada')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/0/07/Empanadas_tucumanas.jpg';
    }
    if (n.includes('alfajor') || n.includes('cookie') || n.includes('factura') || n.includes('medialuna')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/2/22/Alfajores_de_maicena_y_dulce_de_leche.jpg';
    }
    if (n.includes('cereal') || n.includes('turron') || n.includes('barra')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/3/30/Cereal_bar.jpg';
    }
    if (n.includes('yogur')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Yogurt_with_strawberries.jpg';
    }
    if (n.includes('manzana') || n.includes('fruta')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg';
    }
    if (n.includes('pizza')) {
      return 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg';
    }
    return '';
  }
}
