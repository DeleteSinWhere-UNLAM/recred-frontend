import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';
import { Alumno } from '../models/alumno.model';

import { PerfilService } from './perfil.service';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly perfilService = inject(PerfilService);

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

  private readonly homeUrlState = signal<string>(
    typeof localStorage !== 'undefined' && localStorage.getItem('recreopago_homeUrl')
      ? localStorage.getItem('recreopago_homeUrl')!
      : '/tutor'
  );

  readonly homeUrl: Signal<string> = computed(() => {
    const rol = typeof this.perfilService?.rol === 'function' ? this.perfilService.rol() : null;
    if (rol === 'ALUMNO') return '/alumno';
    if (rol === 'VENDEDOR') return '/kiosquero';
    if (rol === 'PADRE') return '/tutor';
    return this.homeUrlState();
  });

  readonly esVistaAlumno: Signal<boolean> = computed(() => this.homeUrl() === '/alumno');
  readonly esVistaKiosquero: Signal<boolean> = computed(() => this.homeUrl() === '/kiosquero');

  private readonly nombreNavbarState = signal<string>(
    typeof localStorage !== 'undefined' && localStorage.getItem('recreopago_nombreNavbar')
      ? localStorage.getItem('recreopago_nombreNavbar')!
      : this.usuarioActual.nombre
  );
  readonly nombreNavbar: Signal<string> = computed(() => {
    const perfil = typeof this.perfilService?.perfil === 'function' ? this.perfilService.perfil() : null;
    if (perfil) {
      return perfil.nombre;
    }
    return this.nombreNavbarState();
  });

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
