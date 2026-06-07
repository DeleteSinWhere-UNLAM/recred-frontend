import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alumno } from '../models/alumno.model';
import { PerfilService } from './perfil.service';

interface StudentDTO {
  readonly id: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly activo?: boolean;
  readonly grado?: string | null;
  readonly colegioId?: string | null;
  readonly saldo?: number | string | null;
}

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);

  private readonly alumnosState = signal<Alumno[]>([]);
  readonly alumnos: Signal<Alumno[]> = this.alumnosState.asReadonly();
  private cargaInFlight: Promise<Alumno[]> | null = null;

  async cargarHijosDelTutor(): Promise<Alumno[]> {
    const url = `${environment.apiUrl.replace(/\/$/, '')}/tutores/me/hijos`;
    console.log('Cargando hijos desde:', url);

    try {
      const dtos = await firstValueFrom(this.http.get<StudentDTO[]>(url));
      console.log('Respuesta raw del back:', dtos);

      if (!dtos || !Array.isArray(dtos)) {
        console.warn('La respuesta del back no es un array válido:', dtos);
        return [];
      }

      const alumnos = dtos.map((dto) => this.fromDto(dto));
      this.alumnosState.set(alumnos);
      console.log('Alumnos procesados y guardados en el estado:', alumnos);
      return alumnos;
    } catch (error) {
      console.error('Error al cargar hijos del tutor:', error);
      throw error;
    }
  }

  asegurarCargados(): Promise<Alumno[]> {
    if (this.alumnosState().length > 0) {
      return Promise.resolve(this.alumnosState());
    }
    if (this.cargaInFlight) {
      return this.cargaInFlight;
    }
    const perfil = this.perfilService.getPerfil();
    if (!perfil) {
      return Promise.resolve([]);
    }
    this.cargaInFlight = this.cargarHijosDelTutor().finally(() => {
      this.cargaInFlight = null;
    });
    return this.cargaInFlight;
  }

  getAlumnos(): Alumno[] {
    return this.alumnosState();
  }

  getAlumnoById(id: string): Alumno | undefined {
    return this.alumnosState().find((alumno) => alumno.id === id);
  }

  private fromDto(dto: StudentDTO): Alumno {
    return {
      id: dto.id,
      nombre: dto.nombre,
      apellido: dto.apellido,
      grado: dto.grado ?? '',
      colegioId: dto.colegioId ?? '',
      saldo: Number(dto.saldo ?? 0),
    };
  }
}
