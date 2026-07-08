import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Colegio } from '../models/colegio.model';
import { Grado } from '../models/grado.model';

@Injectable({ providedIn: 'root' })
export class ColegiosService {
  private readonly http = inject(HttpClient);

  private readonly colegiosState = signal<Colegio[]>([
    { id: 'instituto-san-jose', nombre: 'Instituto San José' },
    { id: 'colegio-santa-maria', nombre: 'Colegio Santa María' },
  ]);

  private cargados = false;

  getColegios(): Colegio[] {
    return this.colegiosState();
  }

  async obtenerColegios(): Promise<Colegio[]> {
    if (this.cargados) {
      return this.colegiosState();
    }
    try {
      const list = await firstValueFrom(
        this.http.get<Colegio[]>(`${environment.apiUrl}/colegios`),
      );
      if (list && list.length > 0) {
        this.colegiosState.set(list);
        this.cargados = true;
      }
      return list;
    } catch (e) {
      console.error('Error fetching colegios from backend:', e);
      return this.colegiosState();
    }
  }

  async obtenerGradosPorColegio(colegioId: string): Promise<Grado[]> {
    return firstValueFrom(
      this.http.get<Grado[]>(
        `${environment.apiUrl}/colegios/${colegioId}/grados`,
      ),
    );
  }

  async obtenerColegiosDelTutor(): Promise<Colegio[]> {
    return firstValueFrom(
      this.http.get<Colegio[]>(`${environment.apiUrl}/tutores/me/colegios`),
    );
  }
}

