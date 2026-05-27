import { Injectable } from '@angular/core';
import { Colegio } from '../models/colegio.model';

@Injectable({ providedIn: 'root' })
export class ColegiosService {
  private readonly colegios: Colegio[] = [
    { id: 'instituto-san-jose', nombre: 'Instituto San José' },
    { id: 'colegio-santa-maria', nombre: 'Colegio Santa María' },
  ];

  getColegios(): Colegio[] {
    return this.colegios;
  }
}
