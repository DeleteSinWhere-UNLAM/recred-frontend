import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { RolUsuario } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  CapacidadAsistente,
  SUGERENCIAS_ASISTENTE_POR_ROL,
  SUGERENCIAS_COMPRA_PENDIENTE,
  SugerenciaCapacidad,
} from '../models/capacidad-asistente.model';
import { MensajeAsistente } from '../models/mensaje-asistente.model';
import {
  MetadataMensajeAsistente,
  MensajeAsistenteResponse,
  SesionAsistenteResponse,
} from '../models/sesion-asistente.model';
import {
  AsistenteVirtualService,
  ContextoAsistente,
} from '../services/asistente-virtual.service';

const MENSAJES_BIENVENIDA: Record<RolUsuario, string> = {
  ALUMNO: '¡Hola! Soy Cred. Puedo ayudarte con tu saldo y tus compras.',
  PADRE:
    '¡Hola! Soy Cred. Puedo ayudarte con tus hijos, presupuestos, compras y restricciones.',
  VENDEDOR:
    '¡Hola! Soy Cred. Puedo ayudarte con stock, ventas, pedidos y eventos escolares.',
};

const MENSAJE_BIENVENIDA_DEFAULT =
  '¡Hola! Soy Cred. ¿En qué te puedo ayudar?';
const MENSAJE_ERROR =
  'No pude responder en este momento. Probá de nuevo en unos minutos.';
const TIPO_COMPRA_RAPIDA = 'COMPRA_RAPIDA';

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
  private readonly capacidadesState = signal<readonly CapacidadAsistente[]>([]);
  private readonly compraPendienteState = signal(false);

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
      !this.compraPendienteState(),
  );

  readonly sugerencias: Signal<readonly SugerenciaCapacidad[]> = computed(() => {
    if (this.compraPendienteState()) {
      return SUGERENCIAS_COMPRA_PENDIENTE;
    }

    const rol = this.perfilService.rol();
    if (!rol) return [];

    const base = SUGERENCIAS_ASISTENTE_POR_ROL[rol];
    if (rol === 'ALUMNO') return base;

    const capacidades = this.capacidadesState();
    if (capacidades.length === 0) return base;

    const permitidas = new Set(capacidades);
    const filtradas = base.filter(
      (s) => !!s.capacidad && permitidas.has(s.capacidad),
    );
    return filtradas.length > 0 ? filtradas : base;
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

      this.capacidadesState.set(respuesta.capacidades ?? []);
      if (this.esMensajeResolucionAccion(limpio)) {
        this.compraPendienteState.set(false);
      }

      this.mensajesState.update((lista) => [
        ...lista,
        this.crearMensajeCred(
          respuesta.respuesta,
          respuesta.generadoPorIa,
          respuesta.fechaHora,
        ),
      ]);

      if (sesionIdRespuesta) {
        await this.actualizarCompraPendienteDesdeHistorial(
          contexto,
          sesionIdRespuesta,
        );
      }
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
    this.capacidadesState.set([]);
    this.compraPendienteState.set(false);
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
      this.actualizarCompraPendienteDesdeMensajes(mensajes);
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
        this.compraPendienteState.set(false);
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

      if (this.tieneCompraRapidaPendiente(mensajes)) {
        this.sesionIdState.set(ultima.sesionId);
        this.compraPendienteState.set(true);
        this.historialDisponibleState.set(false);
        this.mensajesState.set([
          this.crearMensajeCred(this.mensajeBienvenida(), false),
          ...this.obtenerContextoCompraPendiente(mensajes).map((m) =>
            this.mapearMensajeBackend(m),
          ),
        ]);
      } else {
        this.compraPendienteState.set(false);
      }
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

  private async actualizarCompraPendienteDesdeHistorial(
    contexto: ContextoAsistente,
    sesionId: string,
  ): Promise<void> {
    try {
      const mensajes = await this.asistenteService.obtenerMensajes(
        contexto,
        sesionId,
      );
      this.actualizarCompraPendienteDesdeMensajes(mensajes);
    } catch (err) {
      console.warn(
        'No se pudo actualizar el estado de la accion pendiente:',
        err,
      );
    }
  }

  private actualizarCompraPendienteDesdeMensajes(
    mensajes: readonly MensajeAsistenteResponse[],
  ): void {
    const ultimoAsistente = [...mensajes]
      .reverse()
      .find((m) => m.rol === 'ASISTENTE_IA');

    this.compraPendienteState.set(
      this.esCompraRapidaPendiente(ultimoAsistente?.metadata),
    );
  }

  private esCompraRapidaPendiente(
    metadata?: MetadataMensajeAsistente | null,
  ): boolean {
    return (
      metadata?.estadoAccionChatbot === 'PENDIENTE' &&
      metadata.accionPendienteChatbot?.tipo === TIPO_COMPRA_RAPIDA
    );
  }

  private esMensajeResolucionAccion(texto: string): boolean {
    const normalizado = texto.trim().toLowerCase();
    return normalizado === 'confirmar' || normalizado === 'cancelar';
  }

  private tieneCompraRapidaPendiente(
    mensajes: readonly MensajeAsistenteResponse[],
  ): boolean {
    const ultimoAsistente = this.obtenerUltimoMensajeAsistente(mensajes);
    return this.esCompraRapidaPendiente(ultimoAsistente?.metadata);
  }

  private obtenerContextoCompraPendiente(
    mensajes: readonly MensajeAsistenteResponse[],
  ): readonly MensajeAsistenteResponse[] {
    const indicePendiente = this.obtenerIndiceUltimoMensajeAsistente(mensajes);
    if (indicePendiente < 0) return [];

    const pendiente = mensajes[indicePendiente];
    const usuarioPrevio = [...mensajes.slice(0, indicePendiente)]
      .reverse()
      .find((m) => m.rol === 'USUARIO');

    return usuarioPrevio ? [usuarioPrevio, pendiente] : [pendiente];
  }

  private obtenerUltimoMensajeAsistente(
    mensajes: readonly MensajeAsistenteResponse[],
  ): MensajeAsistenteResponse | undefined {
    const indice = this.obtenerIndiceUltimoMensajeAsistente(mensajes);
    return indice >= 0 ? mensajes[indice] : undefined;
  }

  private obtenerIndiceUltimoMensajeAsistente(
    mensajes: readonly MensajeAsistenteResponse[],
  ): number {
    for (let i = mensajes.length - 1; i >= 0; i--) {
      if (mensajes[i].rol === 'ASISTENTE_IA') return i;
    }
    return -1;
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
  ): MensajeAsistente {
    return {
      id: this.crearId(),
      rol: 'cred',
      texto,
      fechaHora: fechaHora ? this.fechaDesdeBackend(fechaHora) : new Date(),
      generadoPorIa,
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

  private fechaDesdeBackend(valor: string): Date {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? new Date() : fecha;
  }

  private crearId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `msg-${Date.now()}`;
  }
}
