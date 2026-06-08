import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';
import { AuthService } from './core/auth/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { PerfilService } from './data-access/services/perfil.service';
import { AsistenteVirtualComponent } from './features/asistente-virtual/asistente-virtual.component';

const RUTAS_SIN_ASISTENTE = new Set(['/', '/seleccion-tipo-cuenta']);

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent, AsistenteVirtualComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private perfilService = inject(PerfilService);

  private rutaActual = signal(this.normalizarUrl(this.router.url));
  private autenticado = signal(false);

  protected mostrarAsistente = computed(
    () =>
      this.autenticado() &&
      this.perfilService.rol() !== null &&
      !RUTAS_SIN_ASISTENTE.has(this.rutaActual()),
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
    }
  }

  private normalizarUrl(url: string): string {
    return url.split('?')[0]?.split('#')[0] || '/';
  }
}
