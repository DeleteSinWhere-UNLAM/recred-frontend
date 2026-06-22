import { Component, inject } from '@angular/core';

import { } from '../../shared/components/navbar/navbar.component';

import { UsuarioService } from '../../data-access/services/usuario.service';

import {
  HijoResumen,
  MensajeHijo,
  ResumenProcesado,
  ResumenSemanal,
} from './models/resumen-semanal.model';

import { ResumenSemanalService } from './services/resumen-semanal.service';

@Component({
  selector: 'app-resumen-semanal-page',
  standalone: true,
  templateUrl: './resumen-semanal.page.html',
  styleUrl: './resumen-semanal.page.css',
  imports: [],
})
export class ResumenSemanalPage {
  private readonly usuarioService = inject(UsuarioService);

  private readonly resumenService = inject(ResumenSemanalService);

  readonly nombreUsuario = this.usuarioService.getUsuarioActual().nombre;

  resumen?: ResumenSemanal;

  resumenProcesado?: ResumenProcesado;

  hijos: { nombre: string; datos: HijoResumen }[] = [];



  constructor() {
    const perfilRaw = localStorage.getItem('recred.perfil');

    const usuarioId = perfilRaw ? JSON.parse(perfilRaw).id : null;

    if (usuarioId) {
      this.resumenService.getResumen(usuarioId).subscribe((data) => {
        this.resumen = data;

        const resumenInterno = JSON.parse(data.resumen);

        const mensajes: MensajeHijo[] = JSON.parse(
          resumenInterno.mensaje ?? '[]',
        );

        this.resumenProcesado = {
          hijos: resumenInterno.hijos,
          mensajes,
        };

        this.hijos = Object.entries(resumenInterno.hijos).map(
          ([nombre, datos]) => ({
            nombre,
            datos: datos as HijoResumen,
          }),
        );
      });
    }
  }

  getCategorias(hijo: HijoResumen) {
    return Object.entries(hijo.porCategoria ?? {});
  }

  formatearFechaString(fechaStr?: string): string {
    if (!fechaStr) return '';
    const parts = fechaStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return fechaStr;
  }

  get totalFamiliar(): number {
    return this.hijos.reduce(
      (total, hijo) => total + (hijo.datos.totalGastado ?? 0),
      0,
    );
  }

  get hijosResumen() {
    return this.hijos
      .map((hijo) => ({
        nombre: hijo.nombre,
        gasto: hijo.datos.totalGastado ?? 0,
        porcentaje:
          this.totalFamiliar > 0
            ? ((hijo.datos.totalGastado ?? 0) / this.totalFamiliar) * 100
            : 0,
      }))
      .sort((a, b) => b.gasto - a.gasto);
  }
}
