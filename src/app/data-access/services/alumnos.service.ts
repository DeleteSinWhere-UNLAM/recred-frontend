import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Alumno } from '../models/alumno.model';
import { PerfilService } from './perfil.service';
import { UsuarioService } from './usuario.service';

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
  private readonly usuarioService = inject(UsuarioService);

  private readonly alumnosState = signal<Alumno[]>([]);
  readonly alumnos: Signal<Alumno[]> = this.alumnosState.asReadonly();
  private cargaInFlight: Promise<Alumno[]> | null = null;

  async cargarHijosDelTutor(): Promise<Alumno[]> {
    const dtos = await firstValueFrom(
      this.http.get<StudentDTO[]>(`${environment.apiUrl}/tutores/me/hijos`),
    );
    const alumnos = dtos.map((dto) => this.fromDto(dto));
    this.alumnosState.set(alumnos);
    return alumnos;
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
    if (perfil.rol === 'ALUMNO') {
      return Promise.resolve(this.getAlumnos());
    }
    this.cargaInFlight = this.cargarHijosDelTutor().finally(() => {
      this.cargaInFlight = null;
    });
    return this.cargaInFlight;
  }

  getAlumnos(): Alumno[] {
    const list = this.alumnosState();
    if (list.length > 0) return list;

    const perfil = this.perfilService.getPerfil();
    if (perfil && perfil.rol === 'ALUMNO') {
      const mock = this.usuarioService.getAlumnoActual();
      const currentId = this.perfilService.obtenerAlumnoId() ?? mock.id;
      return [{
        ...mock,
        id: currentId,
        nombre: perfil.nombre,
        apellido: perfil.apellido,
      }];
    }
    return [];
  }

  getAlumnoById(id: string): Alumno | undefined {
    const found = this.alumnosState().find((alumno) => alumno.id === id);
    if (found) return found;

    const perfil = this.perfilService.getPerfil();
    const mock = this.usuarioService.getAlumnoActual();
    const currentId = this.perfilService.obtenerAlumnoId() ?? mock.id;
    if (id === currentId) {
      return perfil
        ? {
            ...mock,
            id: currentId,
            nombre: perfil.nombre,
            apellido: perfil.apellido,
          }
        : mock;
    }
    return undefined;
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
