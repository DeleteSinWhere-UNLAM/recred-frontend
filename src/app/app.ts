import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';
import { AuthService } from './core/auth/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  async ngOnInit() {
    const isAutenticado = await this.authService.isAutenticado();
    if (isAutenticado) {
      this.notificationService.requestNotificationPermission();
    }
  }
}