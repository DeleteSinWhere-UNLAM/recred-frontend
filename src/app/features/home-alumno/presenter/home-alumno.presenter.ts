import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
import { Alumno } from '../../../data-access/models/alumno.model';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { HomeAlumnoService } from '../services/home-alumno.service';
import { AccionRapida } from '../models/accion-rapida.model';
import { FondoPerfil } from '../models/fondo-perfil.model';
import { PedidoEnCurso } from '../models/pedido-en-curso.model';
import { Recreo } from '../models/recreo.model';

const FONDOS_VALIDOS: readonly FondoPerfil[] = ['nubes', 'minecraft', 'dragonballz', 'gato', 'messi'];
const FONDOS_LEGADOS_A_MINECRAFT: readonly string[] = ['bee', 'creeper'];
const STORAGE_KEY_FONDO = 'home-alumno:fondo-perfil';

const formateadorSaldo = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

@Injectable()
export class HomeAlumnoPresenter {
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly homeAlumnoService = inject(HomeAlumnoService);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly fondoPerfilState = signal<FondoPerfil>('nubes');

  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly fondoPerfil: Signal<FondoPerfil> = this.fondoPerfilState.asReadonly();
  readonly pedidoEnCurso: Signal<PedidoEnCurso | undefined> = computed(() => {
    const id = this.alumnoState()?.id;
    return id ? this.homeAlumnoService.getPedidoEnCurso(id) : undefined;
  });
  readonly proximoRecreo: Signal<Recreo | undefined> = computed(() =>
    this.homeAlumnoService.getProximoRecreo(this.alumnoState()?.colegioId),
  );

  readonly nombreAlumno = computed(() => this.alumnoState()?.nombre ?? '');

  readonly nombreCompleto = computed(() => {
    const a = this.alumnoState();
    return a ? `${a.nombre} ${a.apellido}` : '';
  });

  readonly urlFotoPerfil = computed(() => this.alumnoState()?.urlFotoPerfil ?? null);

  readonly iniciales = computed(() => {
    const a = this.alumnoState();
    if (!a) return '';
    return ((a.nombre[0] ?? '') + (a.apellido[0] ?? '')).toUpperCase();
  });

  readonly grado = computed(() => this.alumnoState()?.grado ?? '');

  readonly nombreColegio = computed(() => {
    const a = this.alumnoState();
    if (!a) return '';
    return (
      this.colegiosService.getColegios().find((c) => c.id === a.colegioId)?.nombre ?? ''
    );
  });

  readonly saldo = computed(() => this.alumnoState()?.saldo ?? 0);
  readonly saldoFormateado = computed(() => formateadorSaldo.format(this.saldo()));
  readonly saldoNegativo = computed(() => this.saldo() < 0);

  readonly tienePedidoEnCurso = computed(() => this.pedidoEnCurso() !== undefined);

  readonly estadoPedidoLabel = computed(() => {
    const p = this.pedidoEnCurso();
    if (!p) return 'Sin pedido para hoy';
    switch (p.estado) {
      case 'PREPARANDO':
        return 'Preparando tu pedido';
      case 'LISTO':
        return 'Listo para retirar';
      case 'ENTREGADO':
        return 'Ya retiraste tu pedido';
      case 'CONFIRMADO':
        return 'Pedido confirmado';
    }
  });

  readonly iconoEstadoPedido = computed(() => {
    const p = this.pedidoEnCurso();
    if (!p) return 'fa-utensils';
    switch (p.estado) {
      case 'PREPARANDO':
        return 'fa-fire';
      case 'LISTO':
        return 'fa-bell';
      case 'ENTREGADO':
        return 'fa-check';
      case 'CONFIRMADO':
        return 'fa-clipboard-check';
    }
  });

  readonly acciones: Signal<AccionRapida[]> = computed(() => [
    {
      id: 'buffet',
      label: 'Ir al buffet',
      descripcion: 'Hacé tu pedido',
      icono: 'fa-utensils',
      emoji: '🍔',
      color: 'menta',
      ruta: '/buffet',
    },
    {
      id: 'pedidos',
      label: 'Mis pedidos',
      descripcion: 'Tu historial de compras y consumos',
      icono: 'fa-receipt',
      emoji: '🛍️',
      color: 'mandarina',
      ruta: '/movimientos',
    },
    {
      id: 'favoritos',
      label: 'Mis favoritos',
      descripcion: 'Lo que más te gusta',
      icono: 'fa-heart',
      emoji: '❤️',
      color: 'melocoton',
      ruta: '/favoritos',
    },
  ]);

  init(): void {
    this.fondoPerfilState.set(this.leerFondoGuardado());
    void this.colegiosService.obtenerColegios();
    void this.alumnosService.asegurarCargados(true).then((alumnos) => {
      const alumnoMock = this.usuarioService.getAlumnoActual();
      const alumnoId = this.perfilService.obtenerAlumnoId() ?? alumnoMock.id;
      const alumno = alumnos.find((a) => a.id === alumnoId) ?? alumnos[0];
      if (alumno) {
        this.alumnoState.set(alumno);
        this.contextoService.setAlumnoId(alumno.id);
        void this.homeAlumnoService.cargarPedidoEnCurso(alumno.id);
        if (alumno.colegioId) {
          void this.homeAlumnoService.cargarRecreos(alumno.colegioId);
        }
      }
    });
  }

  ejecutarAccion(accion: AccionRapida): void {
    if (!accion.ruta) return;
    const alumnoId = this.alumnoState()?.id;
    if (!alumnoId) return;
    if (accion.id === 'buffet') {
      this.contextoService.setAlumnoId(alumnoId);
      void this.router.navigateByUrl(accion.ruta);
      return;
    }
    void this.router.navigateByUrl(accion.ruta);
  }

  irAlBuffet(): void {
    const alumnoId = this.alumnoState()?.id;
    if (!alumnoId) return;
    this.contextoService.setAlumnoId(alumnoId);
    void this.router.navigateByUrl('/buffet');
  }

  verPedido(): void {
    if (this.tienePedidoEnCurso()) {
      this.router.navigateByUrl('/compra');
    } else {
      this.irAlBuffet();
    }
  }

  cambiarFondoPerfil(fondo: FondoPerfil): void {
    if (!FONDOS_VALIDOS.includes(fondo)) return;
    this.fondoPerfilState.set(fondo);
    try {
      localStorage.setItem(STORAGE_KEY_FONDO, fondo);
    } catch {
      /* noop */
    }
  }

  private leerFondoGuardado(): FondoPerfil {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY_FONDO);
      if (guardado && (FONDOS_VALIDOS as readonly string[]).includes(guardado)) {
        return guardado as FondoPerfil;
      }
      if (guardado && FONDOS_LEGADOS_A_MINECRAFT.includes(guardado)) {
        localStorage.setItem(STORAGE_KEY_FONDO, 'minecraft');
        return 'minecraft';
      }
    } catch {
      /* noop */
    }
    return 'nubes';
  }
}
