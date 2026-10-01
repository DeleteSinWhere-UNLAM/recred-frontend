import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ColaboradorDTO {
  readonly id: string;
  readonly email: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly urlFotoPerfil?: string | null;
  readonly activa?: boolean;
}

export interface InvitarColaboradorRequest {
  readonly email: string;
}

@Injectable({ providedIn: 'root' })
export class ColaboradorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tutores/colaboradores`;

  listarColaboradores(): Promise<ColaboradorDTO[]> {
    return firstValueFrom(this.http.get<ColaboradorDTO[]>(this.baseUrl));
  }

  invitarColaborador(email: string): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.baseUrl}/invitar`, { email }));
  }

  eliminarColaborador(colaboradorId: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${colaboradorId}`));
  }
}
