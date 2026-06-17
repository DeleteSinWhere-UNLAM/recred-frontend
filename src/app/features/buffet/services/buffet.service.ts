import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Buffet } from '../models/buffet.model';
import {
  CategoriaProducto,
  ClasificacionSalud,
  EstadoStock,
  Producto,
} from '../models/producto.model';

interface ProductDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stockActual?: number | null;
  stockDisponible?: number | null;
  stockMinimo?: number | null;
  estadoInventario?: string | null;
  categoria?: { id: string; descripcion: string } | null;
  clasificacionesSalud?: { id: string; descripcion: string }[] | null;
}

interface MenuProductoDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stockActual?: number | null;
  stockDisponible?: number | null;
  stockMinimo?: number | null;
  estadoInventario?: string | null;
  bloqueado?: boolean;
  motivoBloqueo?: string | null;
  categoria?: { id: string; descripcion: string } | null;
  clasificacionesSalud?: { id: string; descripcion: string }[] | null;
}

@Injectable({ providedIn: 'root' })
export class BuffetService {
  private readonly http = inject(HttpClient);

  obtenerBuffetDelAlumno(alumnoId: string): Observable<Buffet> {
    return this.http.get<Buffet>(
      `${environment.apiUrl}/alumnos/${alumnoId}/buffet`,
    );
  }

  getProductosDelBuffet(
    buffetId: string,
    alumnoId?: string,
    fechaHoraConsulta?: string,
  ): Observable<Producto[]> {
    if (alumnoId && this.isUuid(alumnoId)) {
      const params: Record<string, string> = { buffetId };
      if (fechaHoraConsulta) {
        params['fechaHoraConsulta'] = fechaHoraConsulta;
      }

      return this.http
        .get<MenuProductoDTO[]>(
          `${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`,
          { params },
        )
        .pipe(
          map((dtos) => dtos.map((dto) => this.mapMenuProductDtoToProducto(dto))),
          catchError((error) => {
            console.warn(
              'Error fetching menu buffet from backend, falling back to products endpoint:',
              error,
            );
            return this.getProductosByBuffetId(buffetId);
          }),
        );
    }

    return this.getProductosByBuffetId(buffetId);
  }

  private getProductosByBuffetId(buffetId: string): Observable<Producto[]> {
    if (!this.isUuid(buffetId)) {
      console.warn(`Invalid buffetId "${buffetId}" when fetching products.`);
      return of([]);
    }

    return this.http
      .get<ProductDTO[]>(`${environment.apiUrl}/products`, { params: { buffetId } })
      .pipe(
        map((dtos) => dtos.map((dto) => this.mapDtoToProducto(dto))),
        catchError((error) => {
          console.warn('Error fetching products from backend:', error);
          return of([]);
        }),
      );
  }

  getCategorias(buffetId: string): CategoriaProducto[] {
    console.warn(
      `getCategorias(${buffetId}) is deprecated; derive categories from loaded products.`,
    );
    return [];
  }

  getClasificacionesSalud(buffetId: string): ClasificacionSalud[] {
    console.warn(
      `getClasificacionesSalud(${buffetId}) is deprecated; derive classifications from loaded products.`,
    );
    return [];
  }

  private isUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
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
      estadoStock: this.mapEstadoStock(dto),
    };
  }

  private mapMenuProductDtoToProducto(dto: MenuProductoDTO): Producto {
    const categoria = dto.categoria ?? {
      id: 'sin-categoria',
      descripcion: 'Sin Categoria',
    };

    const motivoNormalizado = this.normalizarTexto(dto.motivoBloqueo ?? '');
    const esBloqueoPorPresupuesto =
      !!dto.bloqueado &&
      motivoNormalizado.includes('supera') &&
      (motivoNormalizado.includes('gasto') || motivoNormalizado.includes('categor'));
    const esBloqueadoPorTutor =
      !!dto.bloqueado && motivoNormalizado === 'bloqueado por el tutor';
    const esBloqueadoPorRestriccion =
      !!dto.bloqueado && !esBloqueoPorPresupuesto && !esBloqueadoPorTutor;

    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? '',
      precio: dto.precio,
      categoria,
      clasificacionesSalud: dto.clasificacionesSalud ?? [],
      imagen: this.obtenerImagenProducto(dto.nombre),
      estadoStock:
        esBloqueadoPorTutor || esBloqueadoPorRestriccion
          ? 'SIN_STOCK'
          : this.mapEstadoStock(dto),
      bloqueado: esBloqueadoPorTutor,
      bloqueadoPorRestriccion: esBloqueadoPorRestriccion,
      motivoBloqueo: dto.motivoBloqueo ?? undefined,
      superaPresupuesto: esBloqueoPorPresupuesto,
    };
  }

  private mapEstadoStock(dto: ProductDTO | MenuProductoDTO): EstadoStock {
    const estadoInventario = this.normalizarTexto(dto.estadoInventario ?? '');
    if (
      estadoInventario.includes('agotado') ||
      estadoInventario.includes('sin stock') ||
      estadoInventario.includes('sin_stock')
    ) {
      return 'SIN_STOCK';
    }
    if (estadoInventario.includes('bajo')) {
      return 'BAJO_STOCK';
    }

    const disponible = dto.stockDisponible ?? dto.stockActual;
    if (disponible === undefined || disponible === null) {
      return 'DISPONIBLE';
    }
    if (disponible <= 0) {
      return 'SIN_STOCK';
    }
    if (dto.stockMinimo !== undefined && dto.stockMinimo !== null && disponible <= dto.stockMinimo) {
      return 'BAJO_STOCK';
    }
    return 'DISPONIBLE';
  }

  private normalizarTexto(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
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
    if (
      n.includes('alfajor') ||
      n.includes('cookie') ||
      n.includes('factura') ||
      n.includes('medialuna')
    ) {
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
