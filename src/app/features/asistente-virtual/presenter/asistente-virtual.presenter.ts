import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { RolUsuario } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  SUGERENCIAS_ASISTENTE_POR_ROL,
  SUGERENCIAS_COMPRA_PENDIENTE,
  SugerenciaCapacidad,
} from '../models/capacidad-asistente.model';
import { MensajeAsistente } from '../models/mensaje-asistente.model';
import {
  AccionAsistente,
  RespuestaAsistente,
  SugerenciaRespuestaAsistente,
} from '../models/respuesta-asistente.model';
import {
  MensajeAsistenteResponse,
  SesionAsistenteResponse,
} from '../models/sesion-asistente.model';
import {
  AsistenteVirtualService,
  ContextoAsistente,
} from '../services/asistente-virtual.service';

const MENSAJES_BIENVENIDA: Record<RolUsuario, string> = {
  ALUMNO: 'Hola. Soy Cred. Puedo ayudarte con saldo, compras, menu y pedidos.',
  PADRE:
    'Hola. Soy Cred. Puedo ayudarte con hijos, presupuestos, restricciones y eventos.',
  VENDEDOR:
    'Hola. Soy Cred. Puedo ayudarte con stock, ventas, productos y pedidos del buffet.',
};

const MENSAJE_BIENVENIDA_DEFAULT = 'Hola. Soy Cred. En que te puedo ayudar?';
const MENSAJE_ERROR =
  'No pude responder en este momento. Proba de nuevo en unos minutos.';
const ESTADO_ESPERANDO_RECREO = 'ESPERANDO_RECREO';
const ESTADO_ESPERANDO_CONFIRMACION = 'ESPERANDO_CONFIRMACION';

@Injectable()
export class AsistenteVirtualPresenter {
  private readonly perfilService = inject(PerfilService);
  private readonly asistenteService = inject(AsistenteVirtualService);

  private readonly abiertoState = signal(false);
  private readonly mensajesState = signal<MensajeAsistente[]>([]);
  private readonly enviandoState = signal(false);
  private readonly cargandoHistorialState = signal(false);
  private readonly historialRevisadoState = signal(false);
  private readonly historialDisponibleState = signal(false);
  private readonly historialVisibleState = signal(false);
  private readonly sesionIdState = signal<string | null>(null);
  private readonly sesionHistorialState = signal<string | null>(null);
  private readonly accionState = signal<AccionAsistente | null>(null);
  private readonly sugerenciasBackendState = signal<
    readonly SugerenciaCapacidad[]
  >([]);

  readonly abierto: Signal<boolean> = this.abiertoState.asReadonly();
  readonly mensajes: Signal<readonly MensajeAsistente[]> =
    this.mensajesState.asReadonly();
  readonly enviando: Signal<boolean> = this.enviandoState.asReadonly();
  readonly procesando: Signal<boolean> = computed(
    () => this.enviandoState() || this.cargandoHistorialState(),
  );
  readonly puedeVerHistorial: Signal<boolean> = computed(
    () =>
      this.historialDisponibleState() &&
      !this.historialVisibleState() &&
      !this.tieneAccionInteractiva(),
  );
  readonly opcionesDisponibles: Signal<readonly SugerenciaCapacidad[]> =
    computed(() => {
      const rol = this.perfilService.rol();
      return rol ? SUGERENCIAS_ASISTENTE_POR_ROL[rol] : [];
    });

  readonly sugerencias: Signal<readonly SugerenciaCapacidad[]> = computed(() => {
    const accion = this.accionState();
    const sugerenciasBackend = this.sugerenciasBackendState();

    if (accion?.estado === ESTADO_ESPERANDO_CONFIRMACION) {
      return SUGERENCIAS_COMPRA_PENDIENTE;
    }

    if (accion?.estado === ESTADO_ESPERANDO_RECREO) {
      return sugerenciasBackend;
    }

    if (sugerenciasBackend.length > 0) {
      return sugerenciasBackend;
    }

    return [];
  });

  abrir(): void {
    this.asegurarBienvenida();
    this.abiertoState.set(true);
    void this.revisarUltimaSesion();
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
    if (!limpio || this.procesando()) return;

    this.mensajesState.update((lista) => [
      ...lista,
      this.crearMensajeUsuario(limpio),
    ]);
    if (this.sesionIdState() === null) {
      this.historialDisponibleState.set(false);
      this.historialVisibleState.set(false);
    }
    this.enviandoState.set(true);

    try {
      const contexto = this.obtenerContexto();
      if (!contexto) {
        throw new Error('No hay perfil cargado para usar el asistente.');
      }

      const respuesta = await this.asistenteService.enviarMensaje(
        contexto,
        limpio,
        this.sesionIdState(),
      );
      const sesionIdRespuesta = respuesta.sesionId || this.sesionIdState();

      if (sesionIdRespuesta) {
        this.sesionIdState.set(sesionIdRespuesta);
      }

      this.aplicarEstadoRespuesta(respuesta);
      this.mensajesState.update((lista) => [
        ...lista,
        this.crearMensajeCred(
          respuesta.respuesta,
          respuesta.generadoPorIa ?? false,
          respuesta.fechaHora,
          respuesta.accion ?? null,
        ),
      ]);
    } catch (err) {
      console.error('Error enviando mensaje al asistente:', err);
      this.mensajesState.update((lista) => [
        ...lista,
        this.crearMensajeCred(MENSAJE_ERROR, false),
      ]);
    } finally {
      this.enviandoState.set(false);
    }
  }

  enviarSugerencia(prompt: string): Promise<void> {
    return this.enviar(prompt);
  }

  async nuevaConversacion(): Promise<void> {
    if (this.procesando()) return;

    const contexto = this.obtenerContexto();
    const sesionId = this.sesionIdState();

    this.sesionIdState.set(null);
    this.limpiarAccionInteractiva();
    this.historialVisibleState.set(false);
    this.historialDisponibleState.set(this.sesionHistorialState() !== null);
    this.mensajesState.set([this.crearMensajeCred(this.mensajeBienvenida(), false)]);

    if (!contexto || !sesionId) return;

    try {
      await this.asistenteService.cerrarSesion(contexto, sesionId);
    } catch (err) {
      console.error('Error cerrando la sesion del asistente:', err);
    }
  }

  async verMensajesAnteriores(): Promise<void> {
    if (this.procesando() || !this.puedeVerHistorial()) return;

    const contexto = this.obtenerContexto();
    const sesionId = this.sesionHistorialState();
    if (!contexto || !sesionId) return;

    this.cargandoHistorialState.set(true);
    try {
      const mensajes = await this.asistenteService.obtenerMensajes(
        contexto,
        sesionId,
      );
      const mapeados = mensajes.map((m) => this.mapearMensajeBackend(m));
      if (mapeados.length === 0) {
        this.historialDisponibleState.set(false);
        return;
      }

      this.sesionIdState.set(sesionId);
      this.historialVisibleState.set(true);
      this.historialDisponibleState.set(false);
      this.limpiarAccionInteractiva();
      this.mensajesState.set([this.crearSeparadorHistorial(), ...mapeados]);
    } catch (err) {
      console.warn('No se pudo cargar el historial del asistente:', err);
    } finally {
      this.cargandoHistorialState.set(false);
    }
  }

  private async revisarUltimaSesion(): Promise<void> {
    if (
      this.historialRevisadoState() ||
      this.cargandoHistorialState() ||
      this.enviandoState()
    ) {
      return;
    }

    const contexto = this.obtenerContexto();
    if (!contexto) {
      this.historialRevisadoState.set(true);
      return;
    }

    try {
      const sesiones = await this.asistenteService.listarSesiones(contexto);
      const ultima = this.obtenerUltimaSesion(sesiones);
      if (!ultima) {
        this.historialDisponibleState.set(false);
        return;
      }

      const mensajes = await this.asistenteService.obtenerMensajes(
        contexto,
        ultima.sesionId,
      );
      if (!this.mensajesSoloBienvenida() || this.sesionIdState() !== null) {
        return;
      }

      this.sesionHistorialState.set(ultima.sesionId);
      this.historialDisponibleState.set(mensajes.length > 0);
    } catch (err) {
      console.warn('No se pudo revisar la ultima sesion del asistente:', err);
    } finally {
      this.historialRevisadoState.set(true);
    }
  }

  private obtenerUltimaSesion(
    sesiones: readonly SesionAsistenteResponse[],
  ): SesionAsistenteResponse | null {
    const abiertas = sesiones.filter((s) => s.estado === 'ABIERTA');
    const candidatas = abiertas.length > 0 ? abiertas : sesiones;
    const [ultima] = [...candidatas].sort(
      (a, b) =>
        new Date(b.fechaUltimaActividad).getTime() -
        new Date(a.fechaUltimaActividad).getTime(),
    );
    return ultima ?? null;
  }

  private obtenerContexto(): ContextoAsistente | null {
    const perfil = this.perfilService.getPerfil();
    if (!perfil) return null;

    if (perfil.rol === 'ALUMNO') {
      return {
        rol: perfil.rol,
        alumnoId: this.perfilService.obtenerAlumnoId(),
      };
    }

    return { rol: perfil.rol };
  }

  private asegurarBienvenida(): void {
    if (this.mensajesState().length > 0) return;
    this.mensajesState.set([this.crearMensajeCred(this.mensajeBienvenida(), false)]);
  }

  private mensajeBienvenida(): string {
    const rol = this.perfilService.rol();
    return rol ? MENSAJES_BIENVENIDA[rol] : MENSAJE_BIENVENIDA_DEFAULT;
  }

  private aplicarEstadoRespuesta(respuesta: RespuestaAsistente): void {
    const accion = respuesta.accion ?? null;
    const sugerenciasBackend = this.mapearSugerenciasBackend(
      respuesta.sugerencias,
    );

    this.accionState.set(accion);

    if (accion?.estado === ESTADO_ESPERANDO_CONFIRMACION) {
      this.sugerenciasBackendState.set([]);
      return;
    }

    this.sugerenciasBackendState.set(sugerenciasBackend);
  }

  private mapearSugerenciasBackend(
    sugerencias: readonly SugerenciaRespuestaAsistente[] | undefined,
  ): readonly SugerenciaCapacidad[] {
    if (!sugerencias || sugerencias.length === 0) return [];

    return sugerencias
      .filter((s) => s.label.trim().length > 0 && s.mensaje.trim().length > 0)
      .map((s, index) => ({
        id: `backend-${index}-${this.normalizarId(s.mensaje)}`,
        label: s.label.trim(),
        emoji: '',
        prompt: s.mensaje.trim(),
        tipo: 'backend',
        tipoAccion: s.tipoAccion ?? null,
      }));
  }

  private tieneAccionInteractiva(): boolean {
    const estado = this.accionState()?.estado;
    return (
      estado === ESTADO_ESPERANDO_RECREO ||
      estado === ESTADO_ESPERANDO_CONFIRMACION
    );
  }

  private limpiarAccionInteractiva(): void {
    this.accionState.set(null);
    this.sugerenciasBackendState.set([]);
  }

  private mensajesSoloBienvenida(): boolean {
    const mensajes = this.mensajesState();
    return mensajes.length <= 1 && !this.historialVisibleState();
  }

  private mapearMensajeBackend(
    mensaje: MensajeAsistenteResponse,
  ): MensajeAsistente {
    return {
      id: mensaje.id || this.crearId(),
      rol: mensaje.rol === 'USUARIO' ? 'usuario' : 'cred',
      texto: mensaje.contenido,
      fechaHora: this.fechaDesdeBackend(mensaje.fechaHora),
      generadoPorIa: mensaje.rol === 'ASISTENTE_IA',
      accion: mensaje.accion ?? null,
    };
  }

  private crearMensajeUsuario(texto: string): MensajeAsistente {
    return {
      id: this.crearId(),
      rol: 'usuario',
      texto,
      fechaHora: new Date(),
    };
  }

  private crearMensajeCred(
    texto: string,
    generadoPorIa: boolean,
    fechaHora?: string,
    accion?: AccionAsistente | null,
  ): MensajeAsistente {
    return {
      id: this.crearId(),
      rol: 'cred',
      texto,
      fechaHora: this.fechaDesdeBackend(fechaHora),
      generadoPorIa,
      accion,
    };
  }

  private crearSeparadorHistorial(): MensajeAsistente {
    return {
      id: `historial-${this.crearId()}`,
      rol: 'separador',
      texto: 'Mensajes anteriores',
      fechaHora: new Date(),
    };
  }

  private fechaDesdeBackend(valor?: string | null): Date {
    if (!valor) return new Date();

    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? new Date() : fecha;
  }

  private normalizarId(valor: string): string {
    const normalizado = valor
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return normalizado || this.crearId();
  }

  private crearId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `msg-${Date.now()}`;
  }
}
