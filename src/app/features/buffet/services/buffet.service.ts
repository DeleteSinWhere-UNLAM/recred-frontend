import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Buffet } from '../models/buffet.model';
import {
  CategoriaProducto,
  ClasificacionSalud,
  Producto,
} from '../models/producto.model';
interface ProductDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stockActual?: number;
  categoria?: { id: string; descripcion: string } | null;
  clasificacionesSalud?: { id: string; descripcion: string }[] | null;
}

interface MenuProductoDTO {
  id: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  bloqueado?: boolean;
  motivoBloqueo?: string | null;
}

const CAT_COMIDAS: CategoriaProducto = { id: 'comidas', descripcion: 'Comidas' };
const CAT_BEBIDAS: CategoriaProducto = { id: 'bebidas', descripcion: 'Bebidas' };
const CAT_SNACKS: CategoriaProducto = { id: 'snacks', descripcion: 'Snacks' };

const SIN_TACC: ClasificacionSalud = { id: 'sin-tacc', descripcion: 'Sin TACC' };
const SIN_AZUCAR: ClasificacionSalud = { id: 'sin-azucar', descripcion: 'Sin Azúcar' };
const SIN_MANI: ClasificacionSalud = { id: 'sin-mani', descripcion: 'Sin Maní' };
const VEGANO: ClasificacionSalud = { id: 'vegano', descripcion: 'Vegano' };

@Injectable({ providedIn: 'root' })
export class BuffetService {
  private readonly http = inject(HttpClient);

  private readonly buffetsPorColegio: Record<string, Buffet> = {
    'instituto-san-jose': {
      id: 'buffet-san-jose',
      nombre: 'Buffet Instituto San José',
      colegioId: 'instituto-san-jose',
    },
    'colegio-santa-maria': {
      id: 'buffet-santa-maria',
      nombre: 'Buffet Colegio Santa María',
      colegioId: 'colegio-santa-maria',
    },
  };

  private readonly productosPorBuffet: Record<string, Producto[]> = {
    'buffet-san-jose': [
      {
        id: 'sj-sandwich-jq',
        nombre: 'Sándwich de Jamón y Queso',
        descripcion: 'Pan blanco, jamón cocido y queso de máquina.',
        precio: 1200,
        categoria: CAT_COMIDAS,
        clasificacionesSalud: [SIN_AZUCAR, SIN_MANI],
        imagen:
          'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
      {
        id: 'sj-empanada-carne',
        nombre: 'Empanada de Carne',
        descripcion: 'Horneada, repulgue criollo.',
        precio: 850,
        categoria: CAT_COMIDAS,
        clasificacionesSalud: [SIN_AZUCAR, SIN_MANI],
        imagen:
          'https://resizer.glanacion.com/resizer/v2/12072023-empanadas-argentinas-de-sabores-express-BUHGBZQ5FVAITHTZSF3WOFNTFA?auth=f3392dcb14acedb9c3b4a0cf827c58b6c35708303fb388f708f46599c8ac1ac4&width=768&height=576&quality=70&smart=true',
        estadoStock: 'BAJO_STOCK',
      },
      {
        id: 'sj-cookies-choco',
        nombre: 'Cookies de Chocolate y Maní',
        descripcion: 'Pack x3, recién horneadas.',
        precio: 650,
        categoria: CAT_SNACKS,
        clasificacionesSalud: [],
        imagen:
          'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
      {
        id: 'sj-agua-mineral',
        nombre: 'Agua Mineral 500ml',
        descripcion: 'Botella sin gas.',
        precio: 400,
        categoria: CAT_BEBIDAS,
        clasificacionesSalud: [SIN_TACC, SIN_AZUCAR, SIN_MANI, VEGANO],
        imagen:
          'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
      {
        id: 'sj-jugo-naranja',
        nombre: 'Jugo de Naranja Natural',
        descripcion: 'Exprimido en el día, 350ml.',
        precio: 750,
        categoria: CAT_BEBIDAS,
        clasificacionesSalud: [SIN_TACC, SIN_MANI, VEGANO],
        imagen:
          'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
      {
        id: 'sj-barrita-cereal',
        nombre: 'Barrita de Cereal Mix',
        descripcion: 'Avena, miel y frutos secos.',
        precio: 500,
        categoria: CAT_SNACKS,
        clasificacionesSalud: [VEGANO],
        imagen:
          'https://images.unsplash.com/photo-1571748982800-fa51082c2224?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
      {
        id: 'sj-yogur-frutas',
        nombre: 'Yogur con Frutas',
        descripcion: 'Pote de 200g, frutilla y banana.',
        precio: 900,
        categoria: CAT_SNACKS,
        clasificacionesSalud: [SIN_TACC, SIN_MANI],
        imagen:
          'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'SIN_STOCK',
      },
      {
        id: 'sj-manzana',
        nombre: 'Manzana Roja',
        descripcion: 'Fruta de estación.',
        precio: 350,
        categoria: CAT_SNACKS,
        clasificacionesSalud: [SIN_TACC, SIN_AZUCAR, SIN_MANI, VEGANO],
        imagen:
          'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
    ],
    'buffet-santa-maria': [
      {
        id: 'sm-hamburguesa',
        nombre: 'Hamburguesa Completa',
        descripcion: 'Pan, medallón, queso, lechuga y tomate.',
        precio: 1800,
        categoria: CAT_COMIDAS,
        clasificacionesSalud: [SIN_AZUCAR, SIN_MANI],
        imagen:
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
      {
        id: 'sm-ensalada',
        nombre: 'Ensalada César',
        descripcion: 'Pollo, croutons, queso y aderezo.',
        precio: 1500,
        categoria: CAT_COMIDAS,
        clasificacionesSalud: [SIN_MANI],
        imagen:
          'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
      {
        id: 'sm-agua',
        nombre: 'Agua Saborizada',
        descripcion: 'Sabor pomelo, 500ml.',
        precio: 600,
        categoria: CAT_BEBIDAS,
        clasificacionesSalud: [SIN_TACC, SIN_MANI, VEGANO],
        imagen:
          'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=600&q=80',
        estadoStock: 'DISPONIBLE',
      },
    ],
  };

  getBuffetDelAlumno(colegioId: string): Buffet | undefined {
    return this.buffetsPorColegio[colegioId] ?? Object.values(this.buffetsPorColegio)[0];
  }

  obtenerBuffetDelAlumno(alumnoId: string): Observable<Buffet> {
    return this.http.get<Buffet>(
      `${environment.apiUrl}/alumnos/${alumnoId}/buffet`,
    );
  }

  getProductosDelBuffet(buffetId: string, alumnoId?: string): Observable<Producto[]> {
    if (alumnoId && this.isUuid(alumnoId)) {
      return this.http.get<MenuProductoDTO[]>(`${environment.apiUrl}/alumnos/${alumnoId}/menu-buffet`).pipe(
        map(dtos => dtos.map(dto => this.mapMenuProductDtoToProducto(dto))),
        catchError((error) => {
          console.warn('Error fetching menu buffet from backend, falling back to products query:', error);
          return this.getProductosByBuffetId(buffetId);
        })
      );
    }
    return this.getProductosByBuffetId(buffetId);
  }

  private getProductosByBuffetId(buffetId: string): Observable<Producto[]> {
    if (!this.isUuid(buffetId)) {
      return of(this.productosPorBuffet[buffetId] ?? this.productosPorBuffet['buffet-san-jose']);
    }

    return this.http.get<ProductDTO[]>(`${environment.apiUrl}/products`, { params: { buffetId } }).pipe(
      map(dtos => dtos.map(dto => this.mapDtoToProducto(dto))),
      catchError((error) => {
        console.warn('Error fetching products from backend, falling back to mock:', error);
        return of(this.productosPorBuffet['buffet-san-jose'] ?? []);
      })
    );
  }

  getCategorias(buffetId: string): CategoriaProducto[] {
    const productos = this.productosPorBuffet[buffetId] ?? this.productosPorBuffet['buffet-san-jose'] ?? [];
    const porId = new Map<string, CategoriaProducto>();
    for (const p of productos) {
      porId.set(p.categoria.id, p.categoria);
    }
    return [...porId.values()];
  }

  getClasificacionesSalud(buffetId: string): ClasificacionSalud[] {
    const productos = this.productosPorBuffet[buffetId] ?? this.productosPorBuffet['buffet-san-jose'] ?? [];
    const porId = new Map<string, ClasificacionSalud>();
    for (const p of productos) {
      for (const c of p.clasificacionesSalud) {
        porId.set(c.id, c);
      }
    }
    return [...porId.values()];
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
      estadoStock: (dto.stockActual !== undefined ? dto.stockActual : 1) > 0 ? 'DISPONIBLE' : 'SIN_STOCK'
    };
  }

  private mapMenuProductDtoToProducto(dto: MenuProductoDTO): Producto {
    const nombre = dto.nombre.toLowerCase();
    let categoria = { id: 'comidas', descripcion: 'Comidas' };
    if (nombre.includes('coca') || nombre.includes('sprite') || nombre.includes('fanta') || nombre.includes('agua') || nombre.includes('jugo') || nombre.includes('gatorade') || nombre.includes('powerade') || nombre.includes('cafe') || nombre.includes('te') || nombre.includes('cindor') || nombre.includes('bebida') || nombre.includes('levite') || nombre.includes('aquarius')) {
      categoria = { id: 'bebidas', descripcion: 'Bebidas' };
    } else if (nombre.includes('papa') || nombre.includes('cheeto') || nombre.includes('dorito') || nombre.includes('palito') || nombre.includes('alfajor') || nombre.includes('oreo') || nombre.includes('pepito') || nombre.includes('chocolate') || nombre.includes('cookie') || nombre.includes('turron') || nombre.includes('cereal') || nombre.includes('caramelo') || nombre.includes('chicle') || nombre.includes('pochoclo') || nombre.includes('snack')) {
      categoria = { id: 'snacks', descripcion: 'Snacks' };
    }

    const esBloqueoManual = !!dto.bloqueado && dto.motivoBloqueo === 'Bloqueado por el tutor';
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion ?? '',
      precio: dto.precio,
      categoria: categoria,
      clasificacionesSalud: [],
      imagen: this.obtenerImagenProducto(dto.nombre),
      estadoStock: dto.bloqueado ? 'SIN_STOCK' : 'DISPONIBLE',
      bloqueado: esBloqueoManual
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
