import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';
import { Alumno } from '../models/alumno.model';
import { AlumnosService } from './alumnos.service';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly alumnosService = inject(AlumnosService);

  private readonly usuarioActual: Usuario = {
    id: 'usuario-1',
    nombre: 'Martín',
  };

  private readonly alumnoActualId = 'julian-garcia';

  private readonly homeUrlState = signal<string>('/padre');
  readonly homeUrl: Signal<string> = this.homeUrlState.asReadonly();
  readonly esVistaAlumno: Signal<boolean> = computed(() => this.homeUrlState() === '/alumno');

  private readonly nombreNavbarState = signal<string>(this.usuarioActual.nombre);
  readonly nombreNavbar: Signal<string> = this.nombreNavbarState.asReadonly();

  getUsuarioActual(): Usuario {
    return this.usuarioActual;
  }

  getAlumnoActual(): Alumno {
    const alumno = this.alumnosService.getAlumnoById(this.alumnoActualId);
    if (!alumno) {
      throw new Error(`Alumno actual "${this.alumnoActualId}" no existe en AlumnosService`);
    }
    return alumno;
  }

  setHomeUrl(url: string): void {
    this.homeUrlState.set(url);
  }

  setNombreNavbar(nombre: string): void {
    this.nombreNavbarState.set(nombre);
  }
}
