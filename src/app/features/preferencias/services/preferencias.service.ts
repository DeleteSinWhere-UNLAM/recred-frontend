import { Injectable } from '@angular/core';
import { Preferencia } from '../models/preferencia.model';

@Injectable({ providedIn: 'root' })
export class PreferenciasService {

  private readonly preferencias: Preferencia[] = [
    {
      producto: 'Agua',
      score: 95,
      disponible: true,
    },
    {
      producto: 'Tostado',
      score: 88,
      disponible: true,
    },
    {
      producto: 'Jugo',
      score: 40,
      disponible: false,
    },
  ];

  getPreferencias(): Preferencia[] {
    return this.preferencias;
  }
}