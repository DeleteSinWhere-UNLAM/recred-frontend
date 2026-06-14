import {
  Injectable,
  inject,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);
  private injector = inject(Injector);

  requestNotificationPermission() {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        this.handleTokenRegistration();
      }
    });
    this.listenToForegroundMessages();
  }

  handleTokenRegistration() {
    runInInjectionContext(this.injector, () => {
      getToken(this.messaging, {
        vapidKey: environment.firebaseConfig.vapidKey,
      })
        .then((fcmToken) => {
          if (fcmToken) {
            const currentToken = localStorage.getItem('fcm_token');
            if (currentToken !== fcmToken) {
              this.sendTokenToBackend(fcmToken);
              localStorage.setItem('fcm_token', fcmToken);
            }
          }
        })
        .catch((err) => console.error('Error al obtener FCM token:', err));
    });
  }

  private listenToForegroundMessages() {
    runInInjectionContext(this.injector, () => {
      onMessage(this.messaging, (payload) => {
        console.log('Mensaje recibido en primer plano:', payload);

        const title = payload.notification?.title || 'Cambiar este formato';
        const body =
          payload.notification?.body || 'Por algun componente personalizado';

        alert(`🔴 ${title}\n${body}`);
      });
    });
  }

  private sendTokenToBackend(fcmToken: string) {
    this.http
      .post(`${environment.apiUrl}/dispositivos`, { fcmToken })
      .subscribe({
        next: () =>
          console.log('FCM Token registrado exitosamente en el backend.'),
        error: (err) =>
          console.error('Error registrando FCM token en backend:', err),
      });
  }
}
