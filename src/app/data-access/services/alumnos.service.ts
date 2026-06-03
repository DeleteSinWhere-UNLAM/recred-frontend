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

  private readonly STORAGE_KEY = 'recred_alumnos_saldo';

  constructor() {
    this.cargarSaldos();
  }

  async cargarHijosDelTutor(): Promise<Alumno[]> {
    const dtos = await firstValueFrom(
      this.http.get<StudentDTO[]>(`${environment.apiUrl}/tutores/572fd792-ba90-4574-aaeb-1e386d31376f/hijos`),
    );
    const alumnos = dtos.map((dto) => this.fromDto(dto));
    this.aplicarSaldosGuardados(alumnos);
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
    
    // Validamos si hay perfil antes de cargar
    const perfil = this.perfilService.getPerfil();
    if (!perfil) {
      // Si no hay perfil, podríamos retornar vacío o cargar igual si es un entorno de prueba
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

  descontarSaldo(alumnoId: string, monto: number): void {
    const alumnos = this.alumnosState();
    const index = alumnos.findIndex(a => a.id === alumnoId);
    if (index !== -1) {
      const nuevoAlumnos = [...alumnos];
      nuevoAlumnos[index] = { ...nuevoAlumnos[index], saldo: nuevoAlumnos[index].saldo - monto };
      this.alumnosState.set(nuevoAlumnos);
      this.guardarSaldos(nuevoAlumnos);
    }
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

  private cargarSaldos(): void {
    // Los saldos se aplicarán cuando se carguen los alumnos desde el servidor
  }

  private aplicarSaldosGuardados(alumnos: Alumno[]): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const saldos = JSON.parse(stored) as Record<string, number>;
        alumnos.forEach((a) => {
          if (saldos[a.id] !== undefined) {
            a.saldo = saldos[a.id];
          }
        });
      } catch (e) {
        console.error('Error al cargar saldos de localStorage', e);
      }
    }
  }

  private guardarSaldos(alumnos: Alumno[]): void {
    const saldos: Record<string, number> = {};
    alumnos.forEach((a) => {
      saldos[a.id] = a.saldo;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saldos));
  }
}
