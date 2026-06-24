import { Injectable, Signal, computed, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';
import { Alumno } from '../models/alumno.model';

function obtenerHomeUrlInicial(): string {
  if (typeof localStorage === 'undefined') return '/tutor';

  const savedHome = localStorage.getItem('recreopago_homeUrl');
  if (savedHome) return savedHome;

  try {
    const perfilRaw = localStorage.getItem('recred.perfil');
    if (perfilRaw) {
      const perfil = JSON.parse(perfilRaw);
      if (perfil.rol === 'ALUMNO') return '/alumno';
      if (perfil.rol === 'VENDEDOR') return '/kiosquero';
      if (perfil.rol === 'PADRE') return '/tutor';
    }
  } catch (e) {}

  return '/tutor';
}

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
    colegioId: '5fd5acd3-ab97-4d95-aa33-a349bf47d0c8',
    saldo: 2580,
  };

  private readonly homeUrlState = signal<string>(obtenerHomeUrlInicial());
  readonly homeUrl: Signal<string> = this.homeUrlState.asReadonly();
  readonly esVistaAlumno: Signal<boolean> = computed(() => this.homeUrlState() === '/alumno');
  readonly esVistaKiosquero: Signal<boolean> = computed(() => this.homeUrlState() === '/kiosquero');

  private readonly nombreNavbarState = signal<string>(
    typeof localStorage !== 'undefined' && localStorage.getItem('recreopago_nombreNavbar')
      ? localStorage.getItem('recreopago_nombreNavbar')!
      : this.usuarioActual.nombre
  );
  readonly nombreNavbar: Signal<string> = this.nombreNavbarState.asReadonly();

  getUsuarioActual(): Usuario {
    return this.usuarioActual;
  }

  getAlumnoActual(): Alumno {
    return this.alumnoActualMock;
  }

  setHomeUrl(url: string): void {
    this.homeUrlState.set(url);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('recreopago_homeUrl', url);
    }
  }

  setNombreNavbar(nombre: string): void {
    this.nombreNavbarState.set(nombre);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('recreopago_nombreNavbar', nombre);
    }
  }
}
