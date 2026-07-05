import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SchoolOverview, CrearBuffetRequest, CrearBuffetResponse, CrearVendedorRequest, CrearVendedorResponse } from '../models/directivo.model';

@Injectable({
  providedIn: 'root'
})
export class DirectivoService {
  private readonly http = inject(HttpClient);

  public async obtenerResumenColegio(): Promise<SchoolOverview> {
    return firstValueFrom(
      this.http.get<SchoolOverview>(`${environment.apiUrl}/colegios/me`)
    );
  }

  public async crearBuffet(schoolId: string, request: CrearBuffetRequest): Promise<CrearBuffetResponse> {
    return firstValueFrom(
      this.http.post<CrearBuffetResponse>(`${environment.apiUrl}/colegios/${schoolId}/buffets`, request)
    );
  }

  public async registrarVendedor(buffetId: string, request: CrearVendedorRequest): Promise<CrearVendedorResponse> {
    return firstValueFrom(
      this.http.post<CrearVendedorResponse>(`${environment.apiUrl}/buffets/${buffetId}/sellers`, request)
    );
  }
}
