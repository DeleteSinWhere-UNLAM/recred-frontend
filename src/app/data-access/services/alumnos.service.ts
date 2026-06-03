import { Injectable } from '@angular/core';
import { Alumno } from '../models/alumno.model';

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private readonly alumnos: Alumno[] = [
    {
      id: 'julian-garcia',
      nombre: 'Rocio',
      apellido: 'Nemeth',
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

  getAlumnos(): Alumno[] {
    return this.alumnos;
  }

  getAlumnoById(id: string): Alumno | undefined {
    return this.alumnos.find((alumno) => alumno.id === id);
  }
}
