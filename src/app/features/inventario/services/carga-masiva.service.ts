import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RespuestaProductoMasivo {
  nombre: string;
  descripcion: string | null;
  precio: number;
  peso: number;
  requierePreparacion: boolean;
  categoriaId: string | null;
  nuevaCategoriaNombre: string | null;
  stockActual: number;
  saludEtiquetasIds: string[];
  tipoEtiquetasIds: string[];
}

export interface RespuestaCargaMasiva {
  products: RespuestaProductoMasivo[];
}

@Injectable({
  providedIn: 'root'
})
export class CargaMasivaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/products/bulk-upload`;

  uploadFile(file: File): Observable<RespuestaCargaMasiva> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<RespuestaCargaMasiva>(this.baseUrl, formData);
  }
}
