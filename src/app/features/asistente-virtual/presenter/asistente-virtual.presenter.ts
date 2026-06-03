import { Injectable, Signal, inject, signal } from '@angular/core';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  CapacidadAsistente,
  SUGERENCIAS_CAPACIDADES,
  SugerenciaCapacidad,
} from '../models/capacidad-asistente.model';
import { MensajeAsistente } from '../models/mensaje-asistente.model';
import { AsistenteVirtualService } from '../services/asistente-virtual.service';

const MENSAJE_BIENVENIDA = '¡Hola! Soy Cred 🤖 ¿En qué te puedo ayudar?';

@Injectable()
export class AsistenteVirtualPresenter {
  private readonly perfilService = inject(PerfilService);
  private readonly asistenteService = inject(AsistenteVirtualService);

  private readonly abiertoState = signal(false);
  private readonly mensajesState = signal<MensajeAsistente[]>([]);
  private readonly enviandoState = signal(false);
  private readonly sesionIdState = signal<string | null>(null);

  readonly abierto: Signal<boolean> = this.abiertoState.asReadonly();
  readonly mensajes: Signal<readonly MensajeAsistente[]> = this.mensajesState.asReadonly();
  readonly enviando: Signal<boolean> = this.enviandoState.asReadonly();

  readonly sugerencias: readonly SugerenciaCapacidad[] = SUGERENCIAS_CAPACIDADES;

  abrir(): void {
    if (this.mensajesState().length === 0) {
      this.mensajesState.set([this.crearMensajeCred(MENSAJE_BIENVENIDA, false)]);
    }
    this.abiertoState.set(true);
  }

  cerrar(): void {
    this.abiertoState.set(false);
  }

  toggle(): void {
    if (this.abiertoState()) {
      this.cerrar();
    } else {
      this.abrir();
    }
  }

  async enviar(texto: string): Promise<void> {
    const limpio = texto.trim();
    if (!limpio || this.enviandoState()) return;

    this.mensajesState.update((lista) => [
      ...lista,
      this.crearMensajeAlumno(limpio),
    ]);
    this.enviandoState.set(true);

    try {
      const perfil = this.perfilService.getPerfil();
      if (!perfil) {
        throw new Error('No hay perfil cargado: el alumno tiene que estar logueado para usar el asistente.');
      }
      const respuesta = await this.asistenteService.enviarMensaje(
        perfil.id,
        limpio,
        this.sesionIdState(),
      );
      this.sesionIdState.set(respuesta.sesionId);
      this.mensajesState.update((lista) => [
        ...lista,
        this.crearMensajeCred(respuesta.respuesta, respuesta.generadoPorIa),
      ]);
    } finally {
      this.enviandoState.set(false);
    }
  }

  enviarSugerencia(capacidad: CapacidadAsistente): Promise<void> {
    const sugerencia = SUGERENCIAS_CAPACIDADES.find((s) => s.capacidad === capacidad);
    if (!sugerencia) return Promise.resolve();
    return this.enviar(sugerencia.prompt);
  }

  private crearMensajeAlumno(texto: string): MensajeAsistente {
    return {
      id: crypto.randomUUID(),
      rol: 'alumno',
      texto,
      fechaHora: new Date(),
    };
  }

  private crearMensajeCred(texto: string, generadoPorIa: boolean): MensajeAsistente {
    return {
      id: crypto.randomUUID(),
      rol: 'cred',
      texto,
      fechaHora: new Date(),
      generadoPorIa,
    };
  }
}
