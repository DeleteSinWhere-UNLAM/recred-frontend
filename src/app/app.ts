import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';
import { AuthService } from './core/auth/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { PerfilService } from './data-access/services/perfil.service';
import { NotificacionesService } from './data-access/services/notificaciones.service';
import { AsistenteVirtualComponent } from './features/asistente-virtual/asistente-virtual.component';
import { NotificacionSaldoBajoComponent } from "./shared/components/notifications/notificacion-saldo-bajo/notificacion-saldo-bajo.component";
import { NotificacionSugerenciaSaludableComponent } from "./shared/components/notifications/notificacion-sugerencia-saludable/notificacion-sugerencia-saludable.component";
import { ModalComponent } from './shared/components/modal-component/modal-component';
import { DialogService } from './shared/services/dialog.service';

const RUTAS_SIN_ASISTENTE = new Set(['/', '/seleccion-tipo-cuenta']);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent, AsistenteVirtualComponent, NotificacionSaldoBajoComponent, NotificacionSugerenciaSaludableComponent, ModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private perfilService = inject(PerfilService);
  private notificacionesService = inject(NotificacionesService);
  protected readonly dialogService = inject(DialogService);

  private rutaActual = signal(this.normalizarUrl(this.router.url));
  private autenticado = signal(false);

  protected mostrarAsistente = computed(
    () => {
      const rol = this.perfilService.rol();
      return (
        this.autenticado() &&
        rol !== null &&
        rol !== 'DIRECTIVO_COLEGIO' &&
        !RUTAS_SIN_ASISTENTE.has(this.rutaActual())
      );
    },
  );

  async ngOnInit() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.rutaActual.set(this.normalizarUrl(event.urlAfterRedirects));
      });

    const isAutenticado = await this.authService.isAutenticado();
    this.autenticado.set(isAutenticado);
    if (isAutenticado) {
      this.notificationService.requestNotificationPermission();
      this.notificacionesService.obtenerNotificaciones();
    }
  }

  private normalizarUrl(url: string): string {
    return url.split('?')[0]?.split('#')[0] || '/';
  }
}
