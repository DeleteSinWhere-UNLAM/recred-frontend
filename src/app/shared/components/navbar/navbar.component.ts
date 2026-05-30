import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { CarritoService } from '../../../features/compra/services/carrito.service';
import { UsuarioService } from '../../../data-access/services/usuario.service';


interface NavbarNotification {
  title: string;
  message: string;
  route: string;
}
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly carritoService = inject(CarritoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() userName = '';

  protected readonly cartCount = this.carritoService.cantidadTotal;
  protected readonly esVistaAlumno = this.usuarioService.esVistaAlumno;
  protected readonly menuAbierto = signal(false);

  showNotifications = false;

  notifications = this.loadNotifications();

  protected get unreadCount(): number {
    return this.notifications.length;
  }

private intervalId!: ReturnType<typeof setInterval>;

ngOnInit(): void {
  this.intervalId = setInterval(() => {
    this.notifications.push({
      title: 'Nuevo análisis IA',
      message: 'Se detectó un cambio en patrones de consumo',
      route: '/sugerencias',
    });

    this.saveNotifications();
  }, 100000); // 10 segundos
}

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

goToNotification(route: string, index?: number): void {
  this.router.navigateByUrl(route);

  if (index !== undefined) {
    this.notifications.splice(index, 1);
    this.saveNotifications();
  }

  this.showNotifications = false;
}

  private saveNotifications(): void {
    localStorage.setItem(
      'navbar_notifications',
      JSON.stringify(this.notifications)
    );
  }

  private loadNotifications(): NavbarNotification[] {
    const data = localStorage.getItem('navbar_notifications');

    if (data) {
      return JSON.parse(data);
    }

    return [
      {
        title: 'Bajo consumos detectado',
        message: 'La IA detectó productos con ventas bajas.',
        route: '/sugerencias',
      },
      {
        title: 'Reemplazo sugerido',
        message: 'Se encontraron alternativas más vendidas.',
        route: '/sugerencias',
      },
    ];
  }

  protected irAlCarrito(): void {
    this.router.navigateByUrl('/compra');
  }

  protected irAInicio(event: Event): void {
    event.preventDefault();
    this.router.navigateByUrl(this.usuarioService.homeUrl());
  }

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarSesion(): void {
    this.menuAbierto.set(false);
    this.router.navigateByUrl('/');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.menuAbierto()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.menuAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.menuAbierto()) this.menuAbierto.set(false);
    }
  }
}
