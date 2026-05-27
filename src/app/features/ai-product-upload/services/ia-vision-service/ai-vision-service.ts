import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AiProductResponse } from '../../models/ai-product-response.interface';
import { delay, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AiVisionService {
  analyzeImage(file: File): Observable<AiProductResponse> {
    console.log('Analyzing file:', file.name);
    const mockResponse: AiProductResponse = {
      nombre: 'Jugo de Naranja Múltiple',
      marca: 'Cepita',
      categoria: 'Bebidas'
    };

    return of(mockResponse).pipe(delay(3000));
  }
}
