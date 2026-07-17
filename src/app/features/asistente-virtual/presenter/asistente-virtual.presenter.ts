import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { RolUsuario } from '../../../data-access/models/perfil.model';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { ToastService } from '../../../shared/services/toast.service';
import { HomeAlumnoService } from '../../home-alumno/services/home-alumno.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import {
  SUGERENCIAS_ASISTENTE_POR_ROL,
  SUGERENCIAS_COMPRA_PENDIENTE,
  SugerenciaCapacidad,
} from '../models/capacidad-asistente.model';
import { MensajeAsistente } from '../models/mensaje-asistente.model';
import {
  AccionAsistente,
  ESTADO_COMPRA_CANCELADO,
  ESTADO_ESPERANDO_FECHA,
  EstadoAccionAsistente,
  INPUT_FECHA_RETIRO,
  InputRequeridoAsistente,
  RespuestaAsistente,
  SugerenciaRespuestaAsistente,
  TIPO_ACCION_CANCELACION_COMPRA,
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
  ALUMNO: 'Hola. Soy Recredito. Puedo ayudarte con saldo, compras, menu y pedidos.',
  PADRE:
    'Hola. Soy Recredito. Puedo ayudarte con hijos, presupuestos, restricciones y eventos.',
  VENDEDOR:
    'Hola. Soy Recredito. Puedo ayudarte con stock, ventas, productos y pedidos del buffet.',
  ADMIN: 'Hola. Soy Recredito. En que te puedo ayudar?',
  DIRECTIVO_COLEGIO: 'Hola. Soy Recredito. En que te puedo ayudar?',
};

const MENSAJE_BIENVENIDA_DEFAULT = 'Hola. Soy Recredito. En que te puedo ayudar?';
const MENSAJE_ERROR =
  'No pude responder en este momento. Proba de nuevo en unos minutos.';
const ESTADO_ESPERANDO_RECREO = 'ESPERANDO_RECREO';
const ESTADO_ESPERANDO_CONFIRMACION = 'ESPERANDO_CONFIRMACION';
const ESTADO_EJECUTADA = 'EJECUTADA';
type PlanAsistente = 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO';
type PlanAsistenteRequerido = Exclude<PlanAsistente, 'GRATUITO'>;

@Injectable()
export class AsistenteVirtualPresenter {
  private readonly perfilService = inject(PerfilService);
  private readonly asistenteService = inject(AsistenteVirtualService);
  private readonly homeAlumnoService = inject(HomeAlumnoService);
  private readonly toastService = inject(ToastService);
  private readonly alumnosService = inject(AlumnosService);

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
  readonly asistenteBloqueado: Signal<boolean> = computed(() =>
    this.planBloqueadoParaRol('INTERMEDIO'),
  );
  readonly opcionesDisponibles: Signal<readonly SugerenciaCapacidad[]> =
    computed(() => {
      const rol = this.perfilService.rol();
      const opciones = rol ? SUGERENCIAS_ASISTENTE_POR_ROL[rol] : [];
      return opciones.map((opcion) =>
        opcion.premium
          ? {
              ...opcion,
              planRequerido: 'AVANZADO',
              bloqueada: this.planBloqueadoParaRol('AVANZADO'),
            }
          : opcion,
      );
    });

  readonly sugerencias: Signal<readonly SugerenciaCapacidad[]> = computed(() => {
    const accion = this.accionState();
    const sugerenciasBackend = this.sugerenciasBackendState();
    const estadoAccion = this.estadoAccion(accion);

    if (estadoAccion === ESTADO_ESPERANDO_CONFIRMACION) {
      return this.sugerenciasCompraPendiente();
    }

    if (estadoAccion === ESTADO_ESPERANDO_RECREO) {
      return sugerenciasBackend;
    }

    if (this.requiereFechaRetiro()) {
      return [];
    }

    if (sugerenciasBackend.length > 0) {
      return sugerenciasBackend;
    }

    return [];
  });
  readonly requiereFechaRetiro: Signal<boolean> = computed(() => {
    const accion = this.accionState();
    return (
      this.estadoAccion(accion) === ESTADO_ESPERANDO_FECHA &&
      this.inputsAccion(accion).includes(INPUT_FECHA_RETIRO)
    );
  });
  readonly fechaRetiroMinima: Signal<string> = computed(() =>
    this.formatearFechaInput(new Date()),
  );

  abrir(): void {
    if (this.asistenteBloqueado()) {
      this.mostrarBloqueo('INTERMEDIO');
      return;
    }

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
    if (this.asistenteBloqueado()) {
      this.mostrarBloqueo('INTERMEDIO');
      return;
    }
    if (this.confirmacionCompraIaBloqueada(limpio)) {
      this.mostrarBloqueo('AVANZADO');
      return;
    }

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

      const accion = this.aplicarEstadoRespuesta(respuesta);
      this.mensajesState.update((lista) => [
        ...lista,
        this.crearMensajeCred(
          respuesta.respuesta,
          respuesta.generadoPorIa ?? false,
          respuesta.fechaHora,
          accion,
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

  enviarFechaRetiro(fechaInput: string): Promise<void> {
    const mensaje = this.formatearMensajeFechaRetiro(fechaInput);
    return mensaje ? this.enviar(mensaje) : Promise.resolve();
  }

  async nuevaConversacion(): Promise<void> {
    if (this.procesando()) return;
    if (this.asistenteBloqueado()) return;

    const contexto = this.obtenerContexto();
    const sesionId = this.sesionIdState();

    this.sesionIdState.set(null);
    this.sesionHistorialState.set(null);
    this.limpiarAccionInteractiva();
    this.historialVisibleState.set(false);
    this.historialDisponibleState.set(false);
    this.historialRevisadoState.set(false);
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
    if (this.asistenteBloqueado()) return;

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
      this.sesionHistorialState.set(null);
      this.historialVisibleState.set(false);
      this.historialDisponibleState.set(false);
      this.historialRevisadoState.set(false);
    } finally {
      this.cargandoHistorialState.set(false);
    }
  }

  private async revisarUltimaSesion(): Promise<void> {
    if (this.asistenteBloqueado()) return;

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

  private sugerenciasCompraPendiente(): readonly SugerenciaCapacidad[] {
    if (this.perfilService.rol() !== 'ALUMNO') {
      return SUGERENCIAS_COMPRA_PENDIENTE;
    }

    return SUGERENCIAS_COMPRA_PENDIENTE.map((sugerencia) =>
      sugerencia.tipo === 'confirmacion'
        ? {
            ...sugerencia,
            premium: true,
            planRequerido: 'AVANZADO',
            bloqueada: this.planBloqueadoParaRol('AVANZADO'),
          }
        : sugerencia,
    );
  }

  private confirmacionCompraIaBloqueada(texto: string): boolean {
    if (this.perfilService.rol() !== 'ALUMNO') return false;
    if (this.estadoAccion(this.accionState()) !== ESTADO_ESPERANDO_CONFIRMACION) {
      return false;
    }
    if (!this.planBloqueadoParaRol('AVANZADO')) return false;

    const normalizado = texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return ['confirmar', 'si', 'comprar', 'aceptar'].includes(normalizado);
  }

  private planBloqueadoParaRol(planRequerido: PlanAsistenteRequerido): boolean {
    const perfil = this.perfilService.getPerfil();
    const rol = perfil?.rol ?? this.perfilService.rol();
    if (!perfil) return false;
    if (rol !== 'PADRE' && rol !== 'ALUMNO' && rol !== 'VENDEDOR') {
      return false;
    }

    return this.nivelPlan(this.normalizarPlan(perfil.plan)) < this.nivelPlan(planRequerido);
  }

  private normalizarPlan(planActual: string | undefined): PlanAsistente {
    const plan = planActual?.toUpperCase();
    if (plan === 'INTERMEDIO' || plan === 'AVANZADO') return plan;
    return 'GRATUITO';
  }

  private nivelPlan(plan: PlanAsistente): number {
    if (plan === 'AVANZADO') return 2;
    if (plan === 'INTERMEDIO') return 1;
    return 0;
  }

  private mostrarBloqueo(planRequerido: PlanAsistenteRequerido): void {
    const label = planRequerido === 'AVANZADO' ? 'Avanzado' : 'Intermedio';
    this.toastService.mostrar(`Disponible con plan ${label}.`, 'info');
  }

  private obtenerContexto(): ContextoAsistente | null {
    const perfil = this.perfilService.getPerfil();
    if (!perfil) return null;

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

  private aplicarEstadoRespuesta(respuesta: RespuestaAsistente): AccionAsistente | null {
    const accion = this.obtenerAccionRespuesta(respuesta);
    const sugerenciasBackend = this.mapearSugerenciasBackend(
      respuesta.sugerencias,
    );
    const estadoAccion = this.estadoAccion(accion);

    this.accionState.set(accion);

    if (estadoAccion === ESTADO_ESPERANDO_CONFIRMACION) {
      this.sugerenciasBackendState.set([]);
      return accion;
    }

    this.sugerenciasBackendState.set(sugerenciasBackend);

    if (accion && estadoAccion === ESTADO_EJECUTADA) {
      this.refrescarPedidoAlumnoSiAplica();
      if (accion.compraId && !this.esCancelacionCompra(accion)) {
        this.reproducirSonidoExito();
      }
    }

    return accion;
  }

  private reproducirSonidoExito(): void {
    const audio = new Audio('exito.mp3');
    audio.volume = 0.6;
    void audio.play().catch(() => undefined);
  }

  private refrescarPedidoAlumnoSiAplica(): void {
    if (this.perfilService.rol() !== 'ALUMNO') return;
    const alumnoId = this.perfilService.obtenerAlumnoId();
    if (!alumnoId) return;
    void this.homeAlumnoService.cargarPedidoEnCurso(alumnoId);
    void this.alumnosService.asegurarCargados(true);
  }

  private esCancelacionCompra(accion: AccionAsistente): boolean {
    return (
      accion.tipo === TIPO_ACCION_CANCELACION_COMPRA ||
      accion.estadoCompra === ESTADO_COMPRA_CANCELADO
    );
  }

  private obtenerAccionRespuesta(
    respuesta: RespuestaAsistente,
  ): AccionAsistente | null {
    return respuesta.accion ?? respuesta.action ?? null;
  }

  private estadoAccion(
    accion: AccionAsistente | null | undefined,
  ): EstadoAccionAsistente | null {
    return accion?.estado ?? accion?.status ?? null;
  }

  private inputsAccion(
    accion: AccionAsistente | null | undefined,
  ): readonly InputRequeridoAsistente[] {
    return accion?.inputsRequeridos ?? accion?.requiredInputs ?? [];
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
    const estado = this.estadoAccion(this.accionState());
    return (
      estado === ESTADO_ESPERANDO_RECREO ||
      estado === ESTADO_ESPERANDO_CONFIRMACION ||
      estado === ESTADO_ESPERANDO_FECHA
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

  private formatearFechaInput(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatearMensajeFechaRetiro(fechaInput: string): string | null {
    const limpia = fechaInput.trim();
    if (!limpia) return null;

    const partesInput = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpia);
    if (partesInput) {
      const [, year, month, day] = partesInput;
      return `para el ${day}/${month}/${year}`;
    }

    if (/^\d{2}\/\d{2}(\/\d{4})?$/.test(limpia)) {
      return `para el ${limpia}`;
    }

    if (/^para el \d{2}\/\d{2}(\/\d{4})?$/i.test(limpia)) {
      return limpia;
    }

    return null;
  }
}
