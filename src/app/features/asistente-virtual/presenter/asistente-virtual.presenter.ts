import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { RolUsuario } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import {
  CapacidadAsistente,
  SUGERENCIAS_ASISTENTE_POR_ROL,
  SugerenciaCapacidad,
} from '../models/capacidad-asistente.model';
import { MensajeAsistente } from '../models/mensaje-asistente.model';
import {
  MensajeAsistenteResponse,
  SesionAsistenteResponse,
} from '../models/sesion-asistente.model';
import {
  AsistenteVirtualService,
  ContextoAsistente,
} from '../services/asistente-virtual.service';

const MENSAJES_BIENVENIDA: Record<RolUsuario, string> = {
  ALUMNO: '¡Hola! Soy Cred. Puedo ayudarte con tu saldo, compras, pagos y eventos.',
  PADRE:
    '¡Hola! Soy Cred. Puedo ayudarte con tus hijos, presupuestos, compras y restricciones.',
  VENDEDOR:
    '¡Hola! Soy Cred. Puedo ayudarte con stock, ventas, pedidos y eventos escolares.',
};

const MENSAJE_BIENVENIDA_DEFAULT =
  '¡Hola! Soy Cred. ¿En qué te puedo ayudar?';
const MENSAJE_ERROR =
  'No pude responder en este momento. Probá de nuevo en unos minutos.';

@Injectable()
export class AsistenteVirtualPresenter {
  private readonly perfilService = inject(PerfilService);
  private readonly asistenteService = inject(AsistenteVirtualService);

  private readonly abiertoState = signal(false);
  private readonly mensajesState = signal<MensajeAsistente[]>([]);
  private readonly enviandoState = signal(false);
  private readonly cargandoHistorialState = signal(false);
  private readonly historialInicializadoState = signal(false);
  private readonly sesionIdState = signal<string | null>(null);
  private readonly capacidadesState = signal<readonly CapacidadAsistente[]>([]);

  readonly abierto: Signal<boolean> = this.abiertoState.asReadonly();
  readonly mensajes: Signal<readonly MensajeAsistente[]> =
    this.mensajesState.asReadonly();
  readonly enviando: Signal<boolean> = this.enviandoState.asReadonly();
  readonly procesando: Signal<boolean> = computed(
    () => this.enviandoState() || this.cargandoHistorialState(),
  );

  readonly sugerencias: Signal<readonly SugerenciaCapacidad[]> = computed(() => {
    const rol = this.perfilService.rol();
    if (!rol) return [];

    const base = SUGERENCIAS_ASISTENTE_POR_ROL[rol];
    const capacidades = this.capacidadesState();
    if (capacidades.length === 0) return base;

    const permitidas = new Set(capacidades);
    const filtradas = base.filter((s) => permitidas.has(s.capacidad));
    return filtradas.length > 0 ? filtradas : base;
  });

  abrir(): void {
    this.asegurarBienvenida();
    this.abiertoState.set(true);
    void this.cargarUltimaSesion();
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
      this.sesionIdState.set(respuesta.sesionId);
      this.capacidadesState.set(respuesta.capacidades ?? []);
      this.mensajesState.update((lista) => [
        ...lista,
        this.crearMensajeCred(
          respuesta.respuesta,
          respuesta.generadoPorIa,
          respuesta.fechaHora,
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

  enviarSugerencia(capacidad: CapacidadAsistente): Promise<void> {
    const sugerencia = this.sugerencias().find((s) => s.capacidad === capacidad);
    if (!sugerencia) return Promise.resolve();
    return this.enviar(sugerencia.prompt);
  }

  async nuevaConversacion(): Promise<void> {
    if (this.procesando()) return;

    const contexto = this.obtenerContexto();
    const sesionId = this.sesionIdState();

    this.sesionIdState.set(null);
    this.capacidadesState.set([]);
    this.historialInicializadoState.set(true);
    this.mensajesState.set([this.crearMensajeCred(this.mensajeBienvenida(), false)]);

    if (!contexto || !sesionId) return;

    try {
      await this.asistenteService.cerrarSesion(contexto, sesionId);
    } catch (err) {
      console.error('Error cerrando la sesion del asistente:', err);
    }
  }

  private async cargarUltimaSesion(): Promise<void> {
    if (
      this.historialInicializadoState() ||
      this.cargandoHistorialState() ||
      this.enviandoState()
    ) {
      return;
    }

    const contexto = this.obtenerContexto();
    if (!contexto) {
      this.historialInicializadoState.set(true);
      return;
    }

    this.cargandoHistorialState.set(true);
    try {
      const sesiones = await this.asistenteService.listarSesiones(contexto);
      const ultima = this.obtenerUltimaSesion(sesiones);
      if (!ultima) return;

      const mensajes = await this.asistenteService.obtenerMensajes(
        contexto,
        ultima.sesionId,
      );
      const mapeados = mensajes.map((m) => this.mapearMensajeBackend(m));
      this.sesionIdState.set(ultima.sesionId);
      if (mapeados.length > 0) {
        this.mensajesState.set(mapeados);
      }
    } catch (err) {
      console.warn('No se pudo cargar el historial del asistente:', err);
    } finally {
      this.historialInicializadoState.set(true);
      this.cargandoHistorialState.set(false);
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

  private fechaDesdeBackend(valor: string): Date {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? new Date() : fecha;
  }

  private crearId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `msg-${Date.now()}`;
  }
}
