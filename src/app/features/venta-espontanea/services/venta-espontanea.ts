import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AlumnoResumen {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
}

import { BuffetService } from '../../buffet/services/buffet.service';
import { Producto } from '../../buffet/models/producto.model';

export interface ProductoVenta extends Producto {
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class VentaEspontaneaService {
  private http = inject(HttpClient);
  private buffetService = inject(BuffetService);
  
  private alumnosState = signal<AlumnoResumen[]>([]);
  readonly alumnos = this.alumnosState.asReadonly();

  private productosState = signal<ProductoVenta[]>([]);
  readonly productos = this.productosState.asReadonly();

  cargarAlumnos(): Observable<AlumnoResumen[]> {
    return this.http.get<AlumnoResumen[]>(`${environment.apiUrl}/alumnos`).pipe(
      tap((data) => this.alumnosState.set(data))
    );
  }

  cargarProductosDelAlumno(alumnoId: string): Observable<Producto[]> {
    // Usar BuffetService para obtener los productos con todas las propiedades de UI (imagen, categoria, etc)
    return this.buffetService.getProductosDelBuffet('buffet-san-jose', alumnoId).pipe(
      tap((productos: Producto[]) => {
        const prodsVenta = productos.map(p => ({
          ...p,
          cantidad: 0
        }));
        this.productosState.set(prodsVenta);
      })
    );
  }

  procesarVenta(alumnoId: string, items: ProductoVenta[]): Observable<unknown> {
    const payload = {
      studentId: alumnoId,
      items: items.map(i => ({ productId: i.id, quantity: i.cantidad }))
    };
    return this.http.post(`${environment.apiUrl}/purchases/presential`, payload);
  }
}
