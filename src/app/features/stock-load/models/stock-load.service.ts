import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface StockLoadRequest {
  text?: string;
  image?: File;
}

export interface StockLoadResponse {
  success: boolean;
  message: string;
  itemsDetected?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StockLoadService {
  loadStock(request: StockLoadRequest): Observable<StockLoadResponse> {
    return of({
      success: true,
      message: 'Stock cargado correctamente',
      itemsDetected: request.text ? [request.text] : ['producto detectado']
    }).pipe(delay(1000));
  }
}