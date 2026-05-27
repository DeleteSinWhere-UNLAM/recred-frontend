import { Injectable } from '@angular/core';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly usuarioActual: Usuario = {
    id: 'usuario-1',
    nombre: 'Martín',
  };

  getUsuarioActual(): Usuario {
    return this.usuarioActual;
  }
}
