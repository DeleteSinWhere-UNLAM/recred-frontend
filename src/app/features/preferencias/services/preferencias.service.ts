import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, catchError } from 'rxjs';
import { Preferencia } from '../models/preferencia.model';
import { environment } from '../../../../environments/environment';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { Producto } from '../../buffet/models/producto.model';

interface ProductDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stockActual?: number;
  categoria?: { id: string; descripcion: string } | null;
  clasificacionesSalud?: { id: string; descripcion: string }[] | null;
}

@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  private readonly fallbackAlumnoId = '7058aa34-c843-41ca-a8dc-27c496fa7413';

  private getPath(alumnoId: string): string {
    const perfil = this.perfilService.getPerfil();
    if (perfil && perfil.rol === 'ALUMNO' && perfil.id === alumnoId) {
      return `usuarios/${alumnoId}`;
    }
    return `alumnos/${alumnoId}`;
  }

  getPreferencias(): Observable<Preferencia[]> {
    const alumnoId = this.perfilService.obtenerAlumnoId() ?? this.fallbackAlumnoId;
    const path = this.getPath(alumnoId);
    return this.http
      .get<Preferencia[]>(`${environment.apiUrl}/${path}/preferencias?ultima=true`)
      .pipe(map((response) => response));
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
      imagen: this.obtenerImagenProducto(dto.nombre),
      estadoStock: (dto.stockActual !== undefined ? dto.stockActual : 1) > 0 ? 'DISPONIBLE' : 'SIN_STOCK'
    };
  }

  private obtenerImagenProducto(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('coca') || n.includes('gaseosa')) {
      return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80';
    }
    if (n.includes('agua')) {
      return 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80';
    }
    if (n.includes('sandwich') || n.includes('tostado')) {
      return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80';
    }
    if (n.includes('empanada')) {
      return 'https://resizer.glanacion.com/resizer/v2/12072023-empanadas-argentinas-de-sabores-express-BUHGBZQ5FVAITHTZSF3WOFNTFA?auth=f3392dcb14acedb9c3b4a0cf827c58b6c35708303fb388f708f46599c8ac1ac4&width=768&height=576&quality=70&smart=true';
    }
    if (n.includes('alfajor') || n.includes('cookie') || n.includes('factura') || n.includes('medialuna')) {
      return 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80';
    }
    if (n.includes('cereal') || n.includes('turron') || n.includes('barra')) {
      return 'https://images.unsplash.com/photo-1571748982800-fa51082c2224?auto=format&fit=crop&w=600&q=80';
    }
    if (n.includes('yogur')) {
      return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80';
    }
    if (n.includes('manzana') || n.includes('fruta')) {
      return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80';
    }
    if (n.includes('pizza')) {
      return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80';
    }
    return '';
  }
}
