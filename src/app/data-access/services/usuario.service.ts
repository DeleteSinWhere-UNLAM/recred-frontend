import { Injectable, Signal, computed, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';
import { Alumno } from '../models/alumno.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly usuarioActual: Usuario = {
    id: 'usuario-1',
    nombre: 'Martín',
  };

  private readonly alumnoActualMock: Alumno = {
    id: 'julian-garcia',
    nombre: 'Julián',
    apellido: 'García',
    grado: '4to Año A',
    colegioId: 'instituto-san-jose',
    saldo: 2580,
  };

  private readonly homeUrlState = signal<string>('/tutor');
  readonly homeUrl: Signal<string> = this.homeUrlState.asReadonly();
  readonly esVistaAlumno: Signal<boolean> = computed(() => this.homeUrlState() === '/alumno');
  readonly esVistaKiosquero: Signal<boolean> = computed(() => this.homeUrlState() === '/kiosquero');

  private readonly nombreNavbarState = signal<string>(this.usuarioActual.nombre);
  readonly nombreNavbar: Signal<string> = this.nombreNavbarState.asReadonly();

  getUsuarioActual(): Usuario {
    return this.usuarioActual;
  }

  getAlumnoActual(): Alumno {
    return this.alumnoActualMock;
  }

  setHomeUrl(url: string): void {
    this.homeUrlState.set(url);
  }

  setNombreNavbar(nombre: string): void {
    this.nombreNavbarState.set(nombre);
  }
}
