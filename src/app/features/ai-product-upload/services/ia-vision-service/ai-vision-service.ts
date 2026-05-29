import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AiProductResponse } from '../../models/ai-product-response.interface';
import { delay, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AiVisionService {
  analyzeImage(file: File): Observable<AiProductResponse> {
    const mockResponse: AiProductResponse = {
      nombre: 'Jugo de Naranja Múltiple',
      marca: 'Cepita',
      peso: '1L',
      contiene_azucar: 'si',
      contiene_lactosa: 'no',
      contiene_mani: 'no'
    };

    return of(mockResponse).pipe(delay(3000));
  }
}
