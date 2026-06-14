import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Colegio } from '../models/colegio.model';
import { Grado } from '../models/grado.model';

@Injectable({ providedIn: 'root' })
export class ColegiosService {
  private readonly http = inject(HttpClient);

  private readonly colegios: Colegio[] = [
    { id: 'instituto-san-jose', nombre: 'Instituto San José' },
    { id: 'colegio-santa-maria', nombre: 'Colegio Santa María' },
  ];

  getColegios(): Colegio[] {
    return this.colegios;
  }

  async obtenerColegios(): Promise<Colegio[]> {
    return firstValueFrom(
      this.http.get<Colegio[]>(`${environment.apiUrl}/colegios`),
    );
  }

  async obtenerGradosPorColegio(colegioId: string): Promise<Grado[]> {
    return firstValueFrom(
      this.http.get<Grado[]>(
        `${environment.apiUrl}/colegios/${colegioId}/grados`,
      ),
    );
  }
}
