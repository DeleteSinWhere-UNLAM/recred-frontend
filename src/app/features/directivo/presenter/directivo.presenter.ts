import { Injectable, Signal, inject, signal } from '@angular/core';
import { PerfilService } from '../../../data-access/services/perfil.service';

@Injectable()
export class DirectivoPresenter {
  private readonly perfilService = inject(PerfilService);
  
  private readonly _mensajeBienvenida = signal<string>('Cargando...');
  
  public get mensajeBienvenida(): Signal<string> {
    return this._mensajeBienvenida.asReadonly();
  }

  public async inicializar(): Promise<void> {
    try {
      const perfil = await this.perfilService.cargarPerfil();
      this._mensajeBienvenida.set(`Hola bienvenido, ${perfil.nombre}`);
    } catch {
      this._mensajeBienvenida.set('Hola bienvenido');
    }
  }
}
