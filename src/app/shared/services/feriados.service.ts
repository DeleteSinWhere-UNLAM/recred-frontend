import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map, catchError } from 'rxjs';

export interface Feriado {
  motivo: string;
  tipo: string;
  info: string;
  dia: number;
  mes: number;
  id: string;
}

@Injectable({ providedIn: 'root' })
export class FeriadosService {
  private http = inject(HttpClient);
  private cacheFeriados = new Map<number, Feriado[]>();

  obtenerFeriados(anio: number = new Date().getFullYear()): Observable<Feriado[]> {
    if (this.cacheFeriados.has(anio)) {
      return of(this.cacheFeriados.get(anio)!);
    }
    
    return this.http.get<Feriado[]>(`https://nolaborables.com.ar/api/v2/feriados/${anio}`).pipe(
      tap((feriados) => this.cacheFeriados.set(anio, feriados)),
      catchError((err) => {
        console.error('Error obteniendo feriados', err);
        return of([]);
      })
    );
  }

  esFeriadoHoy(): Observable<{ esFeriado: boolean; motivo?: string }> {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth() + 1;
    const anio = hoy.getFullYear();

    return this.obtenerFeriados(anio).pipe(
      map(feriados => {
        const feriado = feriados.find(f => f.dia === dia && f.mes === mes);
        if (feriado) {
          return { esFeriado: true, motivo: feriado.motivo };
        }
        return { esFeriado: false };
      })
    );
  }
}
