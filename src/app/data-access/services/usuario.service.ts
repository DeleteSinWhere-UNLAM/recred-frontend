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

  readonly homeUrl: Signal<string> = computed(() => {
    const rol = this.perfilService.rol();
    if (rol === 'ALUMNO') return '/alumno';
    if (rol === 'VENDEDOR') return '/kiosquero';
    return '/tutor';
  });
  readonly esVistaAlumno: Signal<boolean> = computed(() => this.perfilService.rol() === 'ALUMNO');
  readonly esVistaKiosquero: Signal<boolean> = computed(() => this.perfilService.rol() === 'VENDEDOR');

  private readonly nombreNavbarState = signal<string>(
    typeof localStorage !== 'undefined' && localStorage.getItem('recreopago_nombreNavbar')
      ? localStorage.getItem('recreopago_nombreNavbar')!
      : this.usuarioActual.nombre
  );
  readonly nombreNavbar: Signal<string> = computed(() => {
    const perfil = this.perfilService.perfil();
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
    // No-op for security. derived homeUrl reactive logic takes precedence.
    void url;
  }

  setNombreNavbar(nombre: string): void {
    // Derived name reactive logic takes precedence.
    void nombre;
  }
}
