import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { CarritoService } from '../../../features/compra/services/carrito.service';
import { NotificacionesService, Notificacion } from '../../../data-access/services/notificaciones.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly carritoService = inject(CarritoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly notificacionesService = inject(NotificacionesService);
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() userName = '';

  protected readonly cartCount = this.carritoService.cantidadTotal;
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;
  protected readonly esVistaKiosquero = this.usuarioService.esVistaKiosquero;
  protected readonly notificaciones = this.notificacionesService.notificaciones;
  protected readonly notifCount = this.notificacionesService.cantidad;
  protected readonly menuAbierto = signal(false);
  protected readonly menuNotifAbierto = signal(false);
  protected readonly menuKiosqueroAbierto = signal(false);

  protected irAlCarrito(): void {
    this.router.navigateByUrl('/compra');
  }

  protected irAInicio(event: Event): void {
    event.preventDefault();
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
    if (this.menuAbierto()) {
      this.menuNotifAbierto.set(false);
      this.menuKiosqueroAbierto.set(false);
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

  protected clickEnNotificacion(notif: Notificacion): void {
    if (notif.tipo === 'RESUMEN_SEMANAL') {
      this.menuNotifAbierto.set(false);
      this.router.navigateByUrl('/resumen-semanal');
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
    this.menuKiosqueroAbierto.set(false);
    this.router.navigateByUrl('/recomendaciones-estacionales');
  }

  protected irAPromociones(): void {
    this.menuKiosqueroAbierto.set(false);
    this.router.navigateByUrl('/promociones');
  }

  protected irAPerfil(): void {
    this.menuAbierto.set(false);
    this.router.navigateByUrl('/perfil');
  }

  protected async cerrarSesion(): Promise<void> {
    this.menuAbierto.set(false);
    try {
      await this.authService.logout();
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
      !this.menuKiosqueroAbierto()
    ) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.menuAbierto.set(false);
      this.menuNotifAbierto.set(false);
      this.menuKiosqueroAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuAbierto()) this.menuAbierto.set(false);
    if (this.menuNotifAbierto()) this.menuNotifAbierto.set(false);
    if (this.menuKiosqueroAbierto()) this.menuKiosqueroAbierto.set(false);
  }
}
