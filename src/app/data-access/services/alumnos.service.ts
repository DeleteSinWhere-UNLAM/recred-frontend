import { Injectable } from '@angular/core';
import { Alumno } from '../models/alumno.model';

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private readonly STORAGE_KEY = 'recred_alumnos_saldo';

  private readonly alumnos: Alumno[] = [
    {
      id: 'julian-garcia',
      nombre: 'Julián',
      apellido: 'García',
      grado: '4to Año A',
      colegioId: 'instituto-san-jose',
      saldo: 2580,
    },
    {
      id: 'sofia-garcia',
      nombre: 'Sofía',
      apellido: 'García',
      grado: '1er Año B',
      colegioId: 'instituto-san-jose',
      saldo: 1200,
    },
    {
      id: 'mateo-garcia',
      nombre: 'Mateo',
      apellido: 'García',
      grado: '6to Año C',
      colegioId: 'colegio-santa-maria',
      saldo: 800,
    },
  ];

  constructor() {
    this.cargarSaldos();
  }

  private cargarSaldos(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const saldos = JSON.parse(stored) as Record<string, number>;
        this.alumnos.forEach((a) => {
          if (saldos[a.id] !== undefined) {
            a.saldo = saldos[a.id];
          }
        });
      } catch (e) {
        console.error('Error al cargar saldos de localStorage', e);
      }
    }
  }

  private guardarSaldos(): void {
    const saldos: Record<string, number> = {};
    this.alumnos.forEach((a) => {
      saldos[a.id] = a.saldo;
    });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saldos));
  }

  getAlumnos(): Alumno[] {
    return this.alumnos;
  }

  getAlumnoById(id: string): Alumno | undefined {
    return this.alumnos.find((alumno) => alumno.id === id);
  }

  descontarSaldo(alumnoId: string, monto: number): void {
    const alumno = this.getAlumnoById(alumnoId);
    if (alumno) {
      alumno.saldo -= monto;
      this.guardarSaldos();
    }
  }
}
