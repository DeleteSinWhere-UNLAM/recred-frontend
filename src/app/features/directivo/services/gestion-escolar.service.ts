import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FranjaHorariaColegio,
  FranjaHorariaPayload,
  GradoColegio,
  GradoPayload,
  NivelColegio,
} from '../models/gestion-escolar.model';

@Injectable({ providedIn: 'root' })
export class GestionEscolarService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  public obtenerNiveles(): Promise<NivelColegio[]> {
    return firstValueFrom(this.http.get<NivelColegio[]>(`${this.baseUrl}/niveles`));
  }

  public listarGrados(schoolId: string, includeInactive = false): Promise<GradoColegio[]> {
    return firstValueFrom(
      this.http.get<GradoColegio[]>(`${this.baseUrl}/colegios/${schoolId}/grados`, {
        params: this.paramsIncludeInactive(includeInactive),
      }),
    );
  }

  public obtenerGrado(schoolId: string, gradeId: string): Promise<GradoColegio> {
    return firstValueFrom(
      this.http.get<GradoColegio>(`${this.baseUrl}/colegios/${schoolId}/grados/${gradeId}`),
    );
  }

  public crearGrado(schoolId: string, payload: GradoPayload): Promise<GradoColegio> {
    return firstValueFrom(
      this.http.post<GradoColegio>(`${this.baseUrl}/colegios/${schoolId}/grados`, payload),
    );
  }

  public editarGrado(schoolId: string, gradeId: string, payload: GradoPayload): Promise<GradoColegio> {
    return firstValueFrom(
      this.http.put<GradoColegio>(`${this.baseUrl}/colegios/${schoolId}/grados/${gradeId}`, payload),
    );
  }

  public eliminarGrado(schoolId: string, gradeId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/colegios/${schoolId}/grados/${gradeId}`),
    );
  }

  public reactivarGrado(schoolId: string, gradeId: string): Promise<GradoColegio> {
    return firstValueFrom(
      this.http.patch<GradoColegio>(`${this.baseUrl}/colegios/${schoolId}/grados/${gradeId}/reactivar`, {}),
    );
  }

  public listarFranjas(schoolId: string, includeInactive = false): Promise<FranjaHorariaColegio[]> {
    return firstValueFrom(
      this.http.get<FranjaHorariaColegio[]>(`${this.baseUrl}/colegios/${schoolId}/franjas-horarias`, {
        params: this.paramsIncludeInactive(includeInactive),
      }),
    ).then((franjas) => this.ordenarFranjas(franjas));
  }

  public obtenerFranja(schoolId: string, slotId: string): Promise<FranjaHorariaColegio> {
    return firstValueFrom(
      this.http.get<FranjaHorariaColegio>(`${this.baseUrl}/colegios/${schoolId}/franjas-horarias/${slotId}`),
    );
  }

  public crearFranja(schoolId: string, payload: FranjaHorariaPayload): Promise<FranjaHorariaColegio> {
    return firstValueFrom(
      this.http.post<FranjaHorariaColegio>(`${this.baseUrl}/colegios/${schoolId}/franjas-horarias`, payload),
    );
  }

  public editarFranja(
    schoolId: string,
    slotId: string,
    payload: FranjaHorariaPayload,
  ): Promise<FranjaHorariaColegio> {
    return firstValueFrom(
      this.http.put<FranjaHorariaColegio>(
        `${this.baseUrl}/colegios/${schoolId}/franjas-horarias/${slotId}`,
        payload,
      ),
    );
  }

  public eliminarFranja(schoolId: string, slotId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/colegios/${schoolId}/franjas-horarias/${slotId}`),
    );
  }

  public reactivarFranja(schoolId: string, slotId: string): Promise<FranjaHorariaColegio> {
    return firstValueFrom(
      this.http.patch<FranjaHorariaColegio>(
        `${this.baseUrl}/colegios/${schoolId}/franjas-horarias/${slotId}/reactivar`,
        {},
      ),
    );
  }

  private paramsIncludeInactive(includeInactive: boolean): HttpParams {
    return includeInactive ? new HttpParams().set('includeInactive', 'true') : new HttpParams();
  }

  private ordenarFranjas(franjas: FranjaHorariaColegio[]): FranjaHorariaColegio[] {
    return [...franjas].sort((left, right) => {
      const activos = Number(right.activo) - Number(left.activo);
      if (activos !== 0) return activos;
      return left.horaInicio.localeCompare(right.horaInicio);
    });
  }
}

