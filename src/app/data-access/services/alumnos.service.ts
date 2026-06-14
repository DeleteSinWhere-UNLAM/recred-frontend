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

export interface CrearHijoRequest {
  readonly username: string;
  readonly nombre: string;
  readonly apellido: string;
  readonly email: string;
  readonly dni: string;
  readonly gradoId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private readonly http = inject(HttpClient);
  private readonly perfilService = inject(PerfilService);
  private readonly usuarioService = inject(UsuarioService);

  private readonly alumnosState = signal<Alumno[]>([]);
  readonly alumnos: Signal<Alumno[]> = this.alumnosState.asReadonly();
  private cargaInFlight: Promise<Alumno[]> | null = null;

  async crearHijo(req: CrearHijoRequest): Promise<Alumno> {
    const payload: CrearHijoRequest = {
      username: req.username.trim(),
      nombre: req.nombre.trim(),
      apellido: req.apellido.trim(),
      email: req.email.trim(),
      dni: req.dni.trim(),
      gradoId: req.gradoId?.trim() ? req.gradoId.trim() : null,
    };
    const dto = await firstValueFrom(
      this.http.post<StudentDTO>(
        `${environment.apiUrl}/tutores/me/hijos`,
        payload,
      ),
    );
    const alumno = this.fromDto(dto);
    this.alumnosState.update((actuales) => [...actuales, alumno]);
    return alumno;
  }

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

  async cargarPerfilAlumno(): Promise<Alumno[]> {
    const url = `${environment.apiUrl.replace(/\/$/, '')}/alumnos/me`;
    console.log('Cargando perfil alumno desde:', url);

    try {
      const dto = await firstValueFrom(this.http.get<StudentDTO>(url));
      console.log('Respuesta raw del back (alumno):', dto);

      if (!dto) {
        return this.getMockAlumno();
      }

      const alumno = this.fromDto(dto);
      this.alumnosState.set([alumno]);
      return [alumno];
    } catch (error) {
      console.error('Error al cargar perfil del alumno:', error);
      return this.getMockAlumno();
    }
  }

  private getMockAlumno(): Alumno[] {
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

  asegurarCargados(force = false): Promise<Alumno[]> {
    if (!force && this.alumnosState().length > 0) {
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
      this.cargaInFlight = this.cargarPerfilAlumno().finally(() => {
        this.cargaInFlight = null;
      });
      return this.cargaInFlight;
    }
    this.cargaInFlight = this.cargarHijosDelTutor().finally(() => {
      this.cargaInFlight = null;
    });
    return this.cargaInFlight;
  }

  getAlumnos(): Alumno[] {
    const list = this.alumnosState();
    if (list.length > 0) return list;
    return this.getMockAlumno();
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
