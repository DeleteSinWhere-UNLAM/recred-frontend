import { Injectable, inject, Injector, runInInjectionContext, signal } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id?: string;
  titulo?: string;
  title?: string;
  mensaje?: string;
  body?: string;
  message?: string;
  fecha?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);
  private injector = inject(Injector);

  private readonly notificationsState = signal<AppNotification[]>([]);
  readonly notifications = this.notificationsState.asReadonly();

  requestNotificationPermission() {
    console.log('Solicitando permisos para notificaciones push...');
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Permiso concedido. Procesando token FCM...');
        this.handleTokenRegistration();
      } else {
        console.log('Permiso denegado por el usuario.');
      }
    });
    this.listenToForegroundMessages();
  }

  handleTokenRegistration() {
    runInInjectionContext(this.injector, () => {
      getToken(this.messaging, { vapidKey: environment.firebaseConfig.vapidKey })
        .then((fcmToken) => {
          if (fcmToken) {
            const currentToken = localStorage.getItem('fcm_token');
            console.log(currentToken)
            if (currentToken !== fcmToken) {
              console.log('Token FCM nuevo o rotado. Enviando al backend...');
              console.log(fcmToken)
              this.sendTokenToBackend(fcmToken);
              localStorage.setItem('fcm_token', fcmToken);
            } else {
              console.log('El Token FCM no ha cambiado, no es necesario llamar al backend.');
            }
          } else {
            console.log('No se pudo obtener el token de registro FCM.');
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
        const body = payload.notification?.body || 'Por algun componente personalizado';

        alert(`🔴 ${title}\n${body}`);

        const newNotif = {
          titulo: title,
          mensaje: body,
          fecha: new Date().toISOString()
        };
        this.notificationsState.update(list => [newNotif, ...list]);
      });
    });
  }


  getNotifications() {
    this.http.get<AppNotification[]>(`${environment.apiUrl}/notifications/me`)
      .subscribe({
        next: (notifications) => {
          console.log('List of notifications:', notifications);
          this.notificationsState.set(notifications);
        },
        error: (err) => {
          console.error('Error fetching notifications:', err);
        }
      });
  }

  private sendTokenToBackend(fcmToken: string) {
    this.http.post(`${environment.apiUrl}/dispositivos`, { fcmToken })
      .subscribe({
        next: () => console.log('FCM Token registrado exitosamente en el backend.'),
        error: (err) => console.error('Error registrando FCM token en backend:', err)
      });
  }
}
