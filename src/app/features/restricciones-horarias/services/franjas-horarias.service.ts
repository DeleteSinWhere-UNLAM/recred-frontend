import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TimeSlot } from '../models/restriccion-horaria.model';

@Injectable({ providedIn: 'root' })
export class FranjasHorariasService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  getFranjasHorarias(colegioId: string): Promise<TimeSlot[]> {
    const url = `${this.base}/colegios/${colegioId}/franjas-horarias`;
    console.log('Consultando franjas horarias en:', url);
    return firstValueFrom(
      this.http.get<TimeSlot[]>(url),
    ).then(data => {
      console.log('Franjas horarias recibidas:', data);
      return data;
    }).catch(err => {
      console.error('Error al obtener franjas horarias:', err);
      throw err;
    });
  }
}
