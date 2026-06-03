import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Messaging, getToken, onMessage } from '@angular/fire/messaging';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private messaging = inject(Messaging);
  private http = inject(HttpClient);
  private injector = inject(Injector);

  requestNotificationPermission() {
    console.log('Solicitando permisos para notificaciones push...');
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Permiso concedido. Obteniendo token FCM...');
        runInInjectionContext(this.injector, () => {
          getToken(this.messaging, { vapidKey: environment.firebaseConfig.vapidKey })
            .then((fcmToken) => {
              if (fcmToken) {
                console.log('FCM Token obtenido. Enviando al backend...');
                this.sendTokenToBackend(fcmToken);
              } else {
                console.log('No se pudo obtener el token de registro FCM.');
              }
            })
            .catch((err) => console.error('Error al obtener FCM token:', err));
        });
      } else {
        console.log('Permiso denegado.');
      }
    });

    runInInjectionContext(this.injector, () => {
      onMessage(this.messaging, (payload) => {
        console.log('Mensaje recibido en primer plano:', payload);
        // Aqui podrias mostrar un Toast local usando tu propio ToastService
      });
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
