import { Component, inject } from '@angular/core';

import { NavbarComponent } from '../../shared/components/navbar/navbar.component';

import { UsuarioService } from '../../data-access/services/usuario.service';

import {
  ResumenProcesado,
  ResumenSemanal,
} from './models/resumen-semanal.model';

import { ResumenSemanalService } from './services/resumen-semanal.service';

@Component({
  selector: 'app-resumen-semanal-page',
  standalone: true,
  templateUrl: './resumen-semanal.page.html',
  styleUrl: './resumen-semanal.page.css',
  imports: [NavbarComponent],
})
export class ResumenSemanalPage {
  private readonly usuarioService = inject(UsuarioService);

  private readonly resumenService = inject(ResumenSemanalService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  resumen?: ResumenSemanal;

  resumenProcesado?: ResumenProcesado;

  nombreHijo = '';

  constructor() {
    const perfilRaw = localStorage.getItem('recred.perfil');

    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;

    if (usuarioId) {
      this.resumenService.getResumen(usuarioId).subscribe((data) => {
        this.resumen = data;

        const resumenInterno = JSON.parse(data.resumen);

        const mensajeIA = JSON.parse(resumenInterno.mensaje);

        this.resumenProcesado = {
          hijos: resumenInterno.hijos,
          mensaje: mensajeIA.mensaje,
        };

        this.nombreHijo = Object.keys(resumenInterno.hijos)[0];
      });
    }
  }

  get hijoActual() {
    return this.resumenProcesado?.hijos[this.nombreHijo];
  }

  get categorias() {
    return Object.entries(this.hijoActual?.porCategoria ?? {});
  }
}
