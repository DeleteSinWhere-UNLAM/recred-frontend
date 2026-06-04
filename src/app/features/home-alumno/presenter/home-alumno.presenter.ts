import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Alumno } from '../../../data-access/models/alumno.model';
import { ColegiosService } from '../../../data-access/services/colegios.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { HomeAlumnoService } from '../services/home-alumno.service';
import { AccionRapida } from '../models/accion-rapida.model';
import { PedidoEnCurso } from '../models/pedido-en-curso.model';
import { Recreo } from '../models/recreo.model';

const formateadorSaldo = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

@Injectable()
export class HomeAlumnoPresenter {
  private readonly usuarioService = inject(UsuarioService);
  private readonly perfilService = inject(PerfilService);
  private readonly colegiosService = inject(ColegiosService);
  private readonly homeAlumnoService = inject(HomeAlumnoService);
  private readonly router = inject(Router);

  private readonly alumnoState = signal<Alumno | undefined>(undefined);
  private readonly pedidoState = signal<PedidoEnCurso | undefined>(undefined);
  private readonly recreoState = signal<Recreo | undefined>(undefined);

  readonly alumno: Signal<Alumno | undefined> = this.alumnoState.asReadonly();
  readonly pedidoEnCurso: Signal<PedidoEnCurso | undefined> = this.pedidoState.asReadonly();
  readonly proximoRecreo: Signal<Recreo | undefined> = this.recreoState.asReadonly();

  readonly nombreAlumno = computed(() => this.alumnoState()?.nombre ?? '');

  readonly nombreCompleto = computed(() => {
    const a = this.alumnoState();
    return a ? `${a.nombre} ${a.apellido}` : '';
  });

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

  readonly tienePedidoEnCurso = computed(() => this.pedidoState() !== undefined);

  readonly estadoPedidoLabel = computed(() => {
    const p = this.pedidoState();
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
    const p = this.pedidoState();
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
      descripcion: '¡Mirá qué rico hay hoy!',
      icono: 'fa-utensils',
      emoji: '🍔',
      color: 'menta',
      ruta: '/buffet',
    },
    {
      id: 'pedidos',
      label: 'Mis pedidos',
      descripcion: 'Tus comidas pendientes',
      icono: 'fa-receipt',
      emoji: '🛍️',
      color: 'mandarina',
      ruta: '/compra',
    },
    {
      id: 'preferencias',
      label: 'Mis preferencias',
      descripcion: 'Lo que más te gusta',
      icono: 'fa-heart',
      emoji: '❤️',
      color: 'melocoton',
      ruta: '/preferencias',
    },
  ]);

  init(): void {
    const alumnoMock = this.usuarioService.getAlumnoActual();
    const perfil = this.perfilService.getPerfil();
    const alumno: Alumno = perfil
      ? { ...alumnoMock, nombre: perfil.nombre, apellido: perfil.apellido }
      : alumnoMock;
    this.alumnoState.set(alumno);
    this.pedidoState.set(this.homeAlumnoService.getPedidoEnCurso(alumnoMock.id));
    this.recreoState.set(this.homeAlumnoService.getProximoRecreo(alumnoMock.id));
  }

  ejecutarAccion(accion: AccionRapida): void {
    if (!accion.ruta) return;
    const alumnoId = this.alumnoState()?.id;
    if (!alumnoId) return;
    if (accion.id === 'buffet') {
      this.router.navigate([accion.ruta, alumnoId]);
      return;
    }
    this.router.navigateByUrl(accion.ruta);
  }

  irAlBuffet(): void {
    const alumnoId = this.alumnoState()?.id;
    if (!alumnoId) return;
    this.router.navigate(['/buffet', alumnoId]);
  }

  verPedido(): void {
    if (this.tienePedidoEnCurso()) {
      this.router.navigateByUrl('/compra');
    } else {
      this.irAlBuffet();
    }
  }
}
