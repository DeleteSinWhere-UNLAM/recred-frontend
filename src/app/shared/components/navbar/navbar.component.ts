import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { CarritoService } from '../../../features/compra/services/carrito.service';
import { AlumnosService } from '../../../data-access/services/alumnos.service';
import { PerfilService } from '../../../data-access/services/perfil.service';
import { NotificacionesService, Notificacion } from '../../../data-access/services/notificaciones.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AlumnoContextoService } from '../../../core/services/alumno-contexto.service';
import { ToastService } from '../../services/toast.service';

type PlanNavbar = 'GRATUITO' | 'INTERMEDIO' | 'AVANZADO';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly carritoService = inject(CarritoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly alumnosService = inject(AlumnosService);
  private readonly perfilService = inject(PerfilService);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly themeService = inject(ThemeService);
  private readonly contextoService = inject(AlumnoContextoService);
  private readonly toastService = inject(ToastService);

  @Input() userName = '';

  ngOnInit(): void {
    this.notificacionesService.obtenerNotificaciones();
  }


  protected readonly planPagoLabel = computed(() => {
    const plan = this.planActual();
    if (plan === 'INTERMEDIO') return 'Intermedio';
    if (plan === 'AVANZADO') return 'Avanzado';
    return null;
  });

  protected readonly esPremium = computed(() => this.planPagoLabel() !== null);

  protected readonly cartCount = this.carritoService.cantidadTotal;
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;
  protected readonly esVistaKiosquero = this.usuarioService.esVistaKiosquero;
  protected readonly esVistaDirectivo = this.usuarioService.esVistaDirectivo;
  protected readonly esVistaAdmin = this.usuarioService.esVistaAdmin;
  protected readonly notificaciones = this.notificacionesService.notificaciones;
  protected readonly notifCount = this.notificacionesService.cantidad;
  protected readonly alumnos = this.alumnosService.alumnos;
  protected readonly menuAbierto = signal(false);
  protected readonly menuNotifAbierto = signal(false);
  protected readonly menuKiosqueroAbierto = signal(false);
  protected readonly menuBilleteraAbierto = signal(false);
  protected readonly menuMobileAbierto = signal(false);
  protected readonly temaActivo = this.themeService.theme;

  protected toggleTema(): void {
    this.themeService.toggleTheme();
  }

  protected irAlCarrito(): void {
    this.menuMobileAbierto.set(false);
    this.router.navigateByUrl('/compra');
  }

  protected irAMovimientos(): void {
    this.menuMobileAbierto.set(false);
    this.contextoService.limpiar();
    void this.router.navigateByUrl('/movimientos');
  }

  protected irAInicio(event: Event): void {
    event.preventDefault();
    this.menuMobileAbierto.set(false);
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
    if (this.menuAbierto()) {
      this.menuNotifAbierto.set(false);
      this.menuKiosqueroAbierto.set(false);
    } else {
      this.menuBilleteraAbierto.set(false);
    }
  }

  protected toggleMenuMobile(): void {
    this.menuMobileAbierto.update((abierto) => !abierto);
    if (this.menuMobileAbierto()) {
      this.menuAbierto.set(false);
      this.menuNotifAbierto.set(false);
      this.menuKiosqueroAbierto.set(false);
    }
  }

  protected toggleMenuBilletera(): void {
    this.menuBilleteraAbierto.update((abierto) => !abierto);
    if (this.menuBilleteraAbierto() && this.alumnos().length === 0) {
      void this.alumnosService.asegurarCargados();
    }
  }

  protected toggleNotificaciones(): void {
    this.menuNotifAbierto.update((abierto) => !abierto);
    if (this.menuNotifAbierto()) {
      this.menuAbierto.set(false);
      this.menuKiosqueroAbierto.set(false);
      this.notificacionesService.obtenerNotificaciones();
    }
  }

  protected marcarTodasComoLeidas(): void {
    this.notificacionesService.marcarTodasComoLeidas();
  }

  protected clickEnNotificacion(notif: Notificacion): void {
    this.menuNotifAbierto.set(false);
    console.log('Notificacion clickeada:', notif);

    if (notif.id) {
      this.notificacionesService.marcarComoLeida(notif.id);
    }

    try {
      const esKiosquero = this.perfilService.rol() === 'VENDEDOR' || 
                          (typeof this.esVistaKiosquero === 'function' && this.esVistaKiosquero()) ||
                          (this.esVistaKiosquero as unknown) === true;

      console.log('¿Es vista kiosquero?', esKiosquero);

      if (esKiosquero) {
        if (notif.tipo === 'ESTADO_COMPRA' || notif.tipo === 'RETIRO_PROGRAMADO') {
          const url = notif.compraId 
            ? `/kiosquero/pedidos-tracking?id=${notif.compraId}`
            : '/kiosquero/pedidos-tracking';
          console.log('Navegando a (Kiosquero):', url);
          void this.router.navigateByUrl(url);
        } else if (notif.tipo === 'AGREGAR_PRODUCTO') {
          console.log('Navegando a (Kiosquero Agregar Producto): /sugerencias-agregar');
          void this.router.navigateByUrl('/sugerencias-agregar');
        } else if (notif.tipo === 'SISTEMA') {
          console.log('Navegando a (Kiosquero Stock): /admin-productos');
          void this.router.navigateByUrl('/admin-productos');
        } else {
          console.log('Navegando a (Kiosquero Home): /kiosquero');
          void this.router.navigateByUrl('/kiosquero');
        }
        return;
      }

      if (notif.tipo === 'ESTADO_COMPRA' || notif.tipo === 'RETIRO_PROGRAMADO') {
        if (notif.alumnoId) {
          this.contextoService.setAlumnoId(notif.alumnoId);
        } else {
          this.contextoService.limpiar();
        }
        const url = notif.compraId 
          ? `/movimientos?id=${notif.compraId}`
          : '/movimientos';
        console.log('Navegando a (Tutor):', url);
        void this.router.navigateByUrl(url);
      } else if (notif.tipo === 'RESUMEN_SEMANAL') {
        void this.router.navigateByUrl('/resumen-semanal');
      } else if (notif.tipo === 'SALDO_BAJO') {
        if (notif.alumnoId) {
          this.contextoService.setAlumnoId(notif.alumnoId);
        }
        void this.router.navigateByUrl('/billetera');
      } else if (notif.tipo === 'ALERTA_PRESUPUESTO') {
        if (notif.alumnoId) {
          this.contextoService.setAlumnoId(notif.alumnoId);
        }
        void this.router.navigateByUrl('/presupuesto');
      } else if (notif.tipo === 'ALERTA_RESTRICCION') {
        if (notif.alumnoId) {
          this.contextoService.setAlumnoId(notif.alumnoId);
        }
        void this.router.navigateByUrl('/restricciones-horarias');
      } else if (notif.tipo === 'SUGERENCIA_IA') {
        void this.router.navigateByUrl('/preferencias-detectadas');
      } else if (notif.tipo === 'ALERTA_PRECIO') {
        void this.router.navigateByUrl('/notificaciones-precio');
      } else if (notif.tipo === 'AGREGAR_PRODUCTO') {
        void this.router.navigateByUrl('/sugerencias-agregar');
      } else {
        const fallbackUrl = this.esVistaAlumno() ? '/alumno' : '/tutor-dashboard';
        console.log('Navegando a fallback:', fallbackUrl);
        void this.router.navigateByUrl(fallbackUrl);
      }
    } catch (error) {
      console.error('Error al manejar el click de la notificacion:', error);
      void this.router.navigateByUrl('/kiosquero');
    }
  }

  protected toggleMenuKiosquero(): void {
    this.menuKiosqueroAbierto.update((abierto) => !abierto);
    if (this.menuKiosqueroAbierto()) {
      this.menuAbierto.set(false);
      this.menuNotifAbierto.set(false);
    }
  }

  protected irARecomendacionesEstacionales(): void {
    if (this.planBloqueado('AVANZADO')) {
      this.toastService.mostrar('Disponible con plan Avanzado.', 'info');
      return;
    }
    this.menuKiosqueroAbierto.set(false);
    this.router.navigateByUrl('/recomendaciones-estacionales');
  }

  protected irAPanelControl(event?: Event): void {
    event?.preventDefault();
    if (this.planBloqueado('INTERMEDIO')) {
      this.toastService.mostrar('Disponible con plan Intermedio.', 'info');
      return;
    }
    this.router.navigateByUrl('/kiosquero/reportes');
  }

  protected irAPanelTutor(event?: Event): void {
    event?.preventDefault();
    if (this.planBloqueado('INTERMEDIO')) {
      this.toastService.mostrar('Disponible con plan Intermedio.', 'info');
      return;
    }
    this.router.navigateByUrl('/tutor-dashboard');
  }

  protected irAPromociones(): void {
    if (this.planBloqueado('AVANZADO')) {
      this.toastService.mostrar('Disponible con plan Avanzado.', 'info');
      return;
    }
    this.menuKiosqueroAbierto.set(false);
    this.router.navigateByUrl('/promociones');
  }

  protected irAPerfil(): void {
    this.menuAbierto.set(false);
    this.router.navigateByUrl('/perfil');
  }

  protected irABilletera(): void {
    this.menuAbierto.set(false);
    this.menuBilleteraAbierto.set(false);
    this.router.navigateByUrl('/billetera');
  }

  protected irABilleteraDeHijo(alumnoId: string): void {
    this.menuAbierto.set(false);
    this.menuBilleteraAbierto.set(false);
    this.contextoService.setAlumnoId(alumnoId);
    void this.router.navigateByUrl('/billetera');
  }

  protected irAPremium(): void {
    this.menuAbierto.set(false);
    this.router.navigateByUrl('/suscripcion');
  }

  protected planBloqueado(planRequerido: 'INTERMEDIO' | 'AVANZADO'): boolean {
    return this.nivelPlan(this.planActual()) < this.nivelPlan(planRequerido);
  }

  private planActual(): PlanNavbar {
    if (typeof this.perfilService?.perfil !== 'function') return 'GRATUITO';
    const plan = this.perfilService.perfil()?.plan?.toUpperCase();
    if (plan === 'INTERMEDIO' || plan === 'AVANZADO') return plan;
    return 'GRATUITO';
  }

  private nivelPlan(plan: PlanNavbar): number {
    if (plan === 'AVANZADO') return 2;
    if (plan === 'INTERMEDIO') return 1;
    return 0;
  }

  protected async cerrarSesion(): Promise<void> {
    this.menuAbierto.set(false);
    try {
      await this.authService.logout();
      await this.router.navigateByUrl('/');
    } catch (err) {
      console.error('Error al cerrar sesión', err);
      this.router.navigateByUrl('/');
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (
      !this.menuAbierto() &&
      !this.menuNotifAbierto() &&
      !this.menuKiosqueroAbierto() &&
      !this.menuBilleteraAbierto() &&
      !this.menuMobileAbierto()
    ) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.menuAbierto.set(false);
      this.menuNotifAbierto.set(false);
      this.menuKiosqueroAbierto.set(false);
      this.menuBilleteraAbierto.set(false);
      this.menuMobileAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuAbierto()) this.menuAbierto.set(false);
    if (this.menuNotifAbierto()) this.menuNotifAbierto.set(false);
    if (this.menuKiosqueroAbierto()) this.menuKiosqueroAbierto.set(false);
    if (this.menuBilleteraAbierto()) this.menuBilleteraAbierto.set(false);
    if (this.menuMobileAbierto()) this.menuMobileAbierto.set(false);
  }
}
